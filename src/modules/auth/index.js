const AuthController = require('./controllers/auth.controller');
const AuthService = require('./services/auth.service');
const AuthRepository = require('./repositories/auth.repository');
const createAuthRoutes = require('./routes/auth.routes');

module.exports = {
  AuthController,
  AuthService,
  AuthRepository,
  createAuthRoutes,
};
