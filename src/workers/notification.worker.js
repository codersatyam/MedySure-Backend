const { Worker } = require('bullmq');
const redisConfig = require('../config/redis.config');
const logger = require('../shared/logger');

const createNotificationWorker = ({ supabaseAdmin }) => {
  const worker = new Worker(
    'notification',
    async (job) => {
      const { type } = job.name ? { type: job.name } : { type: 'generic' };

      logger.info('Processing notification job', {
        jobId: job.id,
        type,
        data: job.data,
      });

      switch (type) {
        case 'appointment-created': {
          const { appointmentId, patientId, scheduledAt } = job.data;
          await supabaseAdmin.from('notifications').insert({
            user_id: patientId,
            type: 'appointment_confirmation',
            title: 'Appointment Confirmed',
            message: `Your appointment has been scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
            data: { appointmentId },
          });
          break;
        }
        case 'appointment-status-changed': {
          const { appointmentId: aptId, newStatus, patientId: pId } = job.data;
          await supabaseAdmin.from('notifications').insert({
            user_id: pId,
            type: 'system',
            title: 'Appointment Update',
            message: `Your appointment status has been updated to: ${newStatus}.`,
            data: { appointmentId: aptId, status: newStatus },
          });
          break;
        }
        default:
          logger.warn('Unknown notification type', { type });
      }

      return { processed: true, type };
    },
    {
      connection: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        db: redisConfig.db,
      },
      concurrency: 10,
    }
  );

  worker.on('completed', (job) => {
    logger.debug('Notification job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Notification job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
};

module.exports = createNotificationWorker;
