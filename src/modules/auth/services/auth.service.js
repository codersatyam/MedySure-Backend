// TODO: Implement Auth service methods
class AuthService {
  constructor({ authRepository, redisClient, logger }) {
    this.authRepo = authRepository;
    this.redisClient = redisClient;
    this.logger = logger;
  }
}

module.exports = AuthService;
