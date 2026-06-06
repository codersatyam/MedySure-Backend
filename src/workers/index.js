const logger = require('../shared/logger');
const { getSupabaseAdmin } = require('../shared/database/supabase.admin');
const createEmailWorker = require('./email.worker');
const createNotificationWorker = require('./notification.worker');
const createReportWorker = require('./report.worker');

const startWorkers = () => {
  logger.info('Starting MedySure workers...');

  const supabaseAdmin = getSupabaseAdmin();

  const emailWorker = createEmailWorker();
  const notificationWorker = createNotificationWorker({ supabaseAdmin });
  const reportWorker = createReportWorker();

  logger.info('All workers started');

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down workers...`);

    await emailWorker.close();
    await notificationWorker.close();
    await reportWorker.close();

    logger.info('Workers shut down');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startWorkers();
