const config = require('./config');
const logger = require('./shared/logger');
const createContainer = require('./bootstrap/container');
const createApp = require('./app');

const start = () => {
  try {
    logger.info('Starting MedySure API server...');

    // Build DI container
    const container = createContainer();

    // Create Express app
    const app = createApp(container);

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} [${config.env}]`);
      logger.info(`API available at http://localhost:${config.port}/api/${config.apiVersion}`);
      logger.info(`Health check at http://localhost:${config.port}/api/${config.apiVersion}/health`);
    });

    // Graceful shutdown handler
    const shutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        logger.info('HTTP server closed');
        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { error: reason?.message || reason });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

start();
