const SettingsController = require('./controllers/settings.controller');
const SettingsService = require('./services/settings.service');
const SettingsRepository = require('./repositories/settings.repository');
const createSettingsRoutes = require('./routes/settings.routes');

module.exports = { SettingsController, SettingsService, SettingsRepository, createSettingsRoutes };
