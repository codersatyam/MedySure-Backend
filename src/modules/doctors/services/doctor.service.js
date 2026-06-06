// TODO: Implement Doctor service methods
class DoctorService {
  constructor({ doctorRepository, redisClient, logger }) {
    this.doctorRepo = doctorRepository;
    this.redisClient = redisClient;
    this.logger = logger;
  }
}

module.exports = DoctorService;
