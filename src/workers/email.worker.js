const { Worker } = require('bullmq');
const redisConfig = require('../config/redis.config');
const logger = require('../shared/logger');

const createEmailWorker = () => {
  const worker = new Worker(
    'email',
    (job) => {
      const { to, subject, template } = job.data;

      logger.info('Processing email job', {
        jobId: job.id,
        to,
        subject,
        template,
      });

      // Email sending logic would go here
      // For now, log the email details
      logger.info('Email sent (stub)', { to, subject, template });

      return { sent: true, to, subject };
    },
    {
      connection: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        db: redisConfig.db,
      },
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.debug('Email job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Email job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
};

module.exports = createEmailWorker;
