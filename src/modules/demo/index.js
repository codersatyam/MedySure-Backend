const DemoController = require('./controllers/demo.controller');
const DemoService = require('./services/demo.service');
const DemoRepository = require('./repositories/demo.repository');
const createDemoRoutes = require('./routes/demo.routes');

module.exports = {
  DemoController,
  DemoService,
  DemoRepository,
  createDemoRoutes,
};
