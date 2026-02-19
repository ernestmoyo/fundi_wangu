import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { pool } from './db/pool.js';
import { redis } from './db/redis.js';

const server = app.listen(config.PORT, () => {
  logger.info({
    event: 'server.started',
    port: config.PORT,
    env: config.NODE_ENV,
    pid: process.pid,
  });
});

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info({ event: 'server.shutdown', signal }, 'Shutting down gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (err) {
    logger.error({ err }, 'Error closing database pool');
  }

  try {
    await redis.quit();
    logger.info('Redis connection closed');
  } catch (err) {
    logger.error({ err }, 'Error closing Redis connection');
  }

  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ event: 'unhandled_rejection', reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ event: 'uncaught_exception', err }, 'Uncaught exception');
  process.exit(1);
});
