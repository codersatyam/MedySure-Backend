const { Worker } = require('bullmq');
const redisConfig = require('../config/redis.config');
const logger = require('../shared/logger');

const createReportWorker = () => {
  const worker = new Worker(
    'report',
    (job) => {
      const { reportType, requestedBy } = job.data;

      logger.info('Processing report job', {
        jobId: job.id,
        reportType,
        requestedBy,
      });

      // Report generation logic would go here
      logger.info('Report generated (stub)', { reportType });

      return { generated: true, reportType };
    },
    {
      connection: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        db: redisConfig.db,
      },
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    logger.debug('Report job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Report job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
};

module.exports = createReportWorker;
