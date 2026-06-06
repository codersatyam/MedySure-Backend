const logger = require('../shared/logger');

const createReminderJob = ({ appointmentRepository, notificationQueue }) => {
  return async () => {
    logger.info('Running appointment reminder job');

    try {
      const upcoming = await appointmentRepository.getUpcoming(50);
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const dueReminders = upcoming.filter((apt) => {
        const scheduledAt = new Date(apt.scheduled_at);
        return scheduledAt <= in24h && scheduledAt > now;
      });

      for (const apt of dueReminders) {
        await notificationQueue.add('appointment-reminder', {
          appointmentId: apt.id,
          patientId: apt.patient_id,
          doctorId: apt.doctor_id,
          scheduledAt: apt.scheduled_at,
        });
      }

      logger.info(`Queued ${dueReminders.length} appointment reminders`);
    } catch (err) {
      logger.error('Reminder job failed', { error: err.message });
    }
  };
};

module.exports = createReminderJob;
