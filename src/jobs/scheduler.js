const { Queue } = require('bullmq');
const redisConfig = require('../config/redis.config');
const logger = require('../shared/logger');

const setupScheduler = () => {
  const schedulerQueue = new Queue('scheduler', {
    connection: {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      db: redisConfig.db,
    },
  });

  // Appointment reminders - every 30 minutes
  schedulerQueue.upsertJobScheduler(
    'appointment-reminders',
    { pattern: '*/30 * * * *' },
    { name: 'run-reminders' }
  ).then(() => {
    logger.info('Scheduled: appointment reminders (every 30min)');
  }).catch((err) => {
    logger.error('Failed to schedule reminders', { error: err.message });
  });

  // Overdue billing check - daily at 9am
  schedulerQueue.upsertJobScheduler(
    'overdue-billing',
    { pattern: '0 9 * * *' },
    { name: 'check-overdue-billing' }
  ).then(() => {
    logger.info('Scheduled: overdue billing check (daily 9am)');
  }).catch((err) => {
    logger.error('Failed to schedule overdue billing', { error: err.message });
  });

  // Session cleanup - every 6 hours
  schedulerQueue.upsertJobScheduler(
    'session-cleanup',
    { pattern: '0 */6 * * *' },
    { name: 'cleanup-sessions' }
  ).then(() => {
    logger.info('Scheduled: session cleanup (every 6h)');
  }).catch((err) => {
    logger.error('Failed to schedule cleanup', { error: err.message });
  });

  return schedulerQueue;
};

module.exports = setupScheduler;
