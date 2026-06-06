// TODO: Implement Analytics service methods
class AnalyticsService {
  constructor({ analyticsRepository, redisClient, logger }) {
    this.analyticsRepo = analyticsRepository;
    this.redisClient = redisClient;
    this.logger = logger;
  }
}

module.exports = AnalyticsService;
