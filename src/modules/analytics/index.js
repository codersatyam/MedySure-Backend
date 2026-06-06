const AnalyticsController = require('./controllers/analytics.controller');
const AnalyticsService = require('./services/analytics.service');
const AnalyticsRepository = require('./repositories/analytics.repository');
const createAnalyticsRoutes = require('./routes/analytics.routes');

module.exports = { AnalyticsController, AnalyticsService, AnalyticsRepository, createAnalyticsRoutes };
