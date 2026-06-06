const StaffController = require('./controllers/staff.controller');
const StaffService = require('./services/staff.service');
const StaffRepository = require('./repositories/staff.repository');
const createStaffRoutes = require('./routes/staff.routes');

module.exports = { StaffController, StaffService, StaffRepository, createStaffRoutes };
