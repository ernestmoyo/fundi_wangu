/**
 * Graceful shutdown handler.
 * Ensures in-flight requests complete before the process exits.
 */

import type { Server } from 'node:http';
import { pool } from '../db/pool.js';
import { redis } from '../db/redis.js';
import { logger } from './logger.js';

const SHUTDOWN_TIMEOUT_MS = 15_000;

export function setupGracefulShutdown(server: Server): void {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info({ signal }, 'Graceful shutdown initiated');

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Force exit after timeout
    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    try {
      // Close database pool
      await pool.end();
      logger.info('Database pool closed');

      // Close Redis connection
      await redis.quit();
      logger.info('Redis connection closed');

      logger.info('All connections closed — exiting');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    void shutdown('uncaughtException');
  });
}
