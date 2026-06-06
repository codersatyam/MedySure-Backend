const DoctorController = require('./controllers/doctor.controller');
const DoctorService = require('./services/doctor.service');
const DoctorRepository = require('./repositories/doctor.repository');
const createDoctorRoutes = require('./routes/doctor.routes');

module.exports = { DoctorController, DoctorService, DoctorRepository, createDoctorRoutes };
