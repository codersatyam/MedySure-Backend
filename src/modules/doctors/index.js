const DoctorsController = require('./controllers/doctors.controller');
const DoctorsService = require('./services/doctors.service');
const DoctorsRepository = require('./repositories/doctors.repository');
const createDoctorsRoutes = require('./routes/doctors.routes');

module.exports = {
  DoctorsController,
  DoctorsService,
  DoctorsRepository,
  createDoctorsRoutes,
};
