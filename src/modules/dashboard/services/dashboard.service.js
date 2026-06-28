// TODO: Implement Dashboard service methods
class DashboardService {
  constructor({ dashboardRepository, logger }) {
    this.dashboardRepo = dashboardRepository;
    this.logger = logger;
  }
}

module.exports = DashboardService;
