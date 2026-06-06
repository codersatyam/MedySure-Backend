const DashboardController = require('./controllers/dashboard.controller');
const DashboardService = require('./services/dashboard.service');
const DashboardRepository = require('./repositories/dashboard.repository');
const createDashboardRoutes = require('./routes/dashboard.routes');

module.exports = { DashboardController, DashboardService, DashboardRepository, createDashboardRoutes };
