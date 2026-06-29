const AuthController = require('./controllers/auth.controller');
const AuthService = require('./services/auth.service');
const createAuthRoutes = require('./routes/auth.routes');

module.exports = {
  AuthController,
  AuthService,
  createAuthRoutes,
};
