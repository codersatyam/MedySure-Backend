const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const hpp = require('hpp');

const corsOptions = require('./config/cors.config');
const { globalLimiter } = require('./middlewares/rateLimiter.middleware');
const requestIdMiddleware = require('./middlewares/requestId.middleware');
const sanitizeMiddleware = require('./middlewares/sanitize.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const notFoundHandler = require('./middlewares/notFound.middleware');
// const createAuthMiddleware = require('./middlewares/auth.middleware');
// const createAuditMiddleware = require('./middlewares/audit.middleware');

// --- Module route imports (commented out — modules stripped to skeletons) ---
// const { createAuthRoutes } = require('./modules/auth');
// const { createUserRoutes } = require('./modules/users');
// const { createPatientRoutes } = require('./modules/patients');
// const { createDoctorRoutes } = require('./modules/doctors');
// const { createAppointmentRoutes } = require('./modules/appointments');
// const { createDashboardRoutes } = require('./modules/dashboard');
// const { createNotificationRoutes } = require('./modules/notifications');
// const { createStaffRoutes } = require('./modules/staff');
// const { createAnalyticsRoutes } = require('./modules/analytics');
// const { createBillingRoutes } = require('./modules/billing');
// const { createSettingsRoutes } = require('./modules/settings');

const config = require('./config');
const logger = require('./shared/logger');

const createApp = (container) => {
  const app = express();

  // --- Security middleware ---
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(hpp());

  // --- Body parsing ---
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // --- Compression ---
  app.use(compression());

  // --- Request ID ---
  app.use(requestIdMiddleware);

  // --- Input sanitization ---
  app.use(sanitizeMiddleware);

  // --- HTTP logging ---
  if (config.env !== 'test') {
    app.use(morgan('combined', {
      stream: { write: (message) => logger.http(message.trim()) },
    }));
  }

  // --- Rate limiting ---
  app.use(globalLimiter);

  // --- Health check (unauthenticated) ---
  app.get('/api/v1/health', async (_req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // Check Supabase
    try {
      const { error } = await container.supabaseAdmin.from('roles').select('id').limit(1);
      health.services.database = error ? 'error' : 'ok';
    } catch {
      health.services.database = 'error';
    }

    // Check Redis
    try {
      await container.redisClient.ping();
      health.services.redis = 'ok';
    } catch {
      health.services.redis = 'error';
    }

    const isHealthy = health.services.database === 'ok';
    res.status(isHealthy ? 200 : 503).json(health);
  });

  // --- API Routes (commented out — modules stripped to skeletons) ---
  // Uncomment as modules are rebuilt:
  //
  // const authMiddleware = createAuthMiddleware({
  //   supabaseClient: container.supabaseClient,
  //   redisClient: container.redisClient,
  //   logger: container.logger,
  // });
  //
  // const apiPrefix = `/api/${config.apiVersion}`;
  //
  // app.use(`${apiPrefix}/auth`, createAuthRoutes({ ... }));
  // app.use(`${apiPrefix}/users`, createUserRoutes({ ... }));
  // app.use(`${apiPrefix}/patients`, createPatientRoutes({ ... }));
  // app.use(`${apiPrefix}/doctors`, createDoctorRoutes({ ... }));
  // app.use(`${apiPrefix}/appointments`, createAppointmentRoutes({ ... }));
  // app.use(`${apiPrefix}/dashboard`, createDashboardRoutes({ ... }));
  // app.use(`${apiPrefix}/notifications`, createNotificationRoutes({ ... }));
  // app.use(`${apiPrefix}/staff`, createStaffRoutes({ ... }));
  // app.use(`${apiPrefix}/analytics`, createAnalyticsRoutes({ ... }));
  // app.use(`${apiPrefix}/billing`, createBillingRoutes({ ... }));
  // app.use(`${apiPrefix}/settings`, createSettingsRoutes({ ... }));

  // --- 404 handler ---
  app.use(notFoundHandler);

  // --- Global error handler ---
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
