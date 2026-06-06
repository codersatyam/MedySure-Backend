const UserController = require('./controllers/user.controller');
const UserService = require('./services/user.service');
const UserRepository = require('./repositories/user.repository');
const createUserRoutes = require('./routes/user.routes');

module.exports = {
  UserController,
  UserService,
  UserRepository,
  createUserRoutes,
};
