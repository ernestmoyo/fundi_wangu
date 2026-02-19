import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { initSentry } from './lib/sentry.js';
import { setupGracefulShutdown } from './lib/shutdown.js';

async function start(): Promise<void> {
  // Initialize error tracking
  await initSentry();

  const server = app.listen(config.PORT, () => {
    logger.info({
      event: 'server.started',
      port: config.PORT,
      env: config.NODE_ENV,
      pid: process.pid,
      node: process.version,
    });
  });

  // Register graceful shutdown handlers
  setupGracefulShutdown(server);
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
