const PatientController = require('./controllers/patient.controller');
const PatientService = require('./services/patient.service');
const PatientRepository = require('./repositories/patient.repository');
const createPatientRoutes = require('./routes/patient.routes');

module.exports = { PatientController, PatientService, PatientRepository, createPatientRoutes };
