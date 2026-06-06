const AppointmentController = require('./controllers/appointment.controller');
const AppointmentService = require('./services/appointment.service');
const AppointmentRepository = require('./repositories/appointment.repository');
const createAppointmentRoutes = require('./routes/appointment.routes');

module.exports = { AppointmentController, AppointmentService, AppointmentRepository, createAppointmentRoutes };
