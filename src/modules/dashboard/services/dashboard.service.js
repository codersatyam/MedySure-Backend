// TODO: Implement Dashboard service methods
class DashboardService {
  constructor({ dashboardRepository, redisClient, logger }) {
    this.dashboardRepo = dashboardRepository;
    this.redisClient = redisClient;
    this.logger = logger;
  }
}

module.exports = DashboardService;
