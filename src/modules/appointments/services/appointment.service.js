// TODO: Implement Appointment service methods
class AppointmentService {
  constructor({ appointmentRepository, redisClient, logger, notificationQueue }) {
    this.appointmentRepo = appointmentRepository;
    this.redisClient = redisClient;
    this.logger = logger;
    this.notificationQueue = notificationQueue;
  }
}

module.exports = AppointmentService;
