// TODO: Implement User service methods
class UserService {
  constructor({ userRepository, redisClient, logger }) {
    this.userRepo = userRepository;
    this.redisClient = redisClient;
    this.logger = logger;
  }
}

module.exports = UserService;
