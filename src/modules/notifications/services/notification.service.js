// TODO: Implement Notification service methods
class NotificationService {
  constructor({ notificationRepository, logger }) {
    this.notificationRepo = notificationRepository;
    this.logger = logger;
  }
}

module.exports = NotificationService;
