const { getSupabaseClient } = require('../shared/database/supabase.client');
const { getSupabaseAdmin } = require('../shared/database/supabase.admin');
const { getRedisClient } = require('../shared/redis/client');
const logger = require('../shared/logger');
const { getNotificationQueue, getEmailQueue } = require('../shared/queues/queues');

// --- Module imports (commented out — modules stripped to skeletons) ---
// const { AuthController, AuthService, AuthRepository } = require('../modules/auth');
// const { UserController, UserService, UserRepository } = require('../modules/users');
// const { PatientController, PatientService, PatientRepository } = require('../modules/patients');
// const { DoctorController, DoctorService, DoctorRepository } = require('../modules/doctors');
// const { AppointmentController, AppointmentService, AppointmentRepository } = require('../modules/appointments');
// const { DashboardController, DashboardService, DashboardRepository } = require('../modules/dashboard');
// const { NotificationController, NotificationService, NotificationRepository } = require('../modules/notifications');
// const { StaffController, StaffService, StaffRepository } = require('../modules/staff');
// const { AnalyticsController, AnalyticsService, AnalyticsRepository } = require('../modules/analytics');
// const { BillingController, BillingService, BillingRepository } = require('../modules/billing');
// const { SettingsController, SettingsService, SettingsRepository } = require('../modules/settings');

const createContainer = () => {
  // --- Singletons ---
  const supabaseClient = getSupabaseClient();
  const supabaseAdmin = getSupabaseAdmin();
  const redisClient = getRedisClient();

  // --- Queues (lazy, safe to fail) ---
  let notificationQueue = null;
  let emailQueue = null;
  try {
    notificationQueue = getNotificationQueue();
    emailQueue = getEmailQueue();
  } catch (err) {
    logger.warn('Queue initialization skipped (Redis may not be available)', { error: err.message });
  }

  // --- Repositories (commented out — modules stripped to skeletons) ---
  // const authRepository = new AuthRepository({ supabaseAdmin });
  // const userRepository = new UserRepository({ supabaseAdmin });
  // const patientRepository = new PatientRepository({ supabaseAdmin });
  // const doctorRepository = new DoctorRepository({ supabaseAdmin });
  // const appointmentRepository = new AppointmentRepository({ supabaseAdmin });
  // const dashboardRepository = new DashboardRepository({ supabaseAdmin });
  // const notificationRepository = new NotificationRepository({ supabaseAdmin });
  // const staffRepository = new StaffRepository({ supabaseAdmin });
  // const analyticsRepository = new AnalyticsRepository({ supabaseAdmin });
  // const billingRepository = new BillingRepository({ supabaseAdmin });
  // const settingsRepository = new SettingsRepository({ supabaseAdmin });

  // --- Services (commented out — modules stripped to skeletons) ---
  // const authService = new AuthService({ authRepository, redisClient, logger });
  // const userService = new UserService({ userRepository, redisClient, logger });
  // const patientService = new PatientService({ patientRepository, logger });
  // const doctorService = new DoctorService({ doctorRepository, redisClient, logger });
  // const appointmentService = new AppointmentService({
  //   appointmentRepository, redisClient, logger, notificationQueue,
  // });
  // const dashboardService = new DashboardService({ dashboardRepository, redisClient, logger });
  // const notificationService = new NotificationService({ notificationRepository, logger });
  // const staffService = new StaffService({ staffRepository, logger });
  // const analyticsService = new AnalyticsService({ analyticsRepository, redisClient, logger });
  // const billingService = new BillingService({ billingRepository, logger });
  // const settingsService = new SettingsService({ settingsRepository, redisClient, logger });

  // --- Controllers (commented out — modules stripped to skeletons) ---
  // const authController = new AuthController({ authService });
  // const userController = new UserController({ userService });
  // const patientController = new PatientController({ patientService });
  // const doctorController = new DoctorController({ doctorService });
  // const appointmentController = new AppointmentController({ appointmentService });
  // const dashboardController = new DashboardController({ dashboardService });
  // const notificationController = new NotificationController({ notificationService });
  // const staffController = new StaffController({ staffService });
  // const analyticsController = new AnalyticsController({ analyticsService });
  // const billingController = new BillingController({ billingService });
  // const settingsController = new SettingsController({ settingsService });

  return {
    // Singletons
    supabaseClient,
    supabaseAdmin,
    redisClient,
    logger,
    emailQueue,
    notificationQueue,

    // Repositories — uncomment as modules are rebuilt
    // authRepository,
    // userRepository,
    // patientRepository,
    // doctorRepository,
    // appointmentRepository,
    // dashboardRepository,
    // notificationRepository,
    // staffRepository,
    // analyticsRepository,
    // billingRepository,
    // settingsRepository,

    // Services — uncomment as modules are rebuilt
    // authService,
    // userService,
    // patientService,
    // doctorService,
    // appointmentService,
    // dashboardService,
    // notificationService,
    // staffService,
    // analyticsService,
    // billingService,
    // settingsService,

    // Controllers — uncomment as modules are rebuilt
    // authController,
    // userController,
    // patientController,
    // doctorController,
    // appointmentController,
    // dashboardController,
    // notificationController,
    // staffController,
    // analyticsController,
    // billingController,
    // settingsController,
  };
};

module.exports = createContainer;
