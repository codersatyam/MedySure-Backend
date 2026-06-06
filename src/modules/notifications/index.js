const NotificationController = require('./controllers/notification.controller');
const NotificationService = require('./services/notification.service');
const NotificationRepository = require('./repositories/notification.repository');
const createNotificationRoutes = require('./routes/notification.routes');

module.exports = { NotificationController, NotificationService, NotificationRepository, createNotificationRoutes };
