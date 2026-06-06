const { getQueue } = require('./queue.client');

const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  REPORT: 'report',
};

const getEmailQueue = () => getQueue(QUEUE_NAMES.EMAIL);
const getNotificationQueue = () => getQueue(QUEUE_NAMES.NOTIFICATION);
const getReportQueue = () => getQueue(QUEUE_NAMES.REPORT);

module.exports = {
  QUEUE_NAMES,
  getEmailQueue,
  getNotificationQueue,
  getReportQueue,
};
