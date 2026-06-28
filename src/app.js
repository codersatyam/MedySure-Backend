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
const { createHealthRoutes } = require('./modules/health');


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

  const apiPrefix = `/api/${config.apiVersion}`;

  // --- Health check (unauthenticated) ---
  // GET /api/v1/health       — liveness (server is up)
  // GET /api/v1/health/ready  — readiness (server + dependencies are ready)
  app.use(`${apiPrefix}/health`, createHealthRoutes({ healthController: container.healthController }));

  // --- API Routes (commented out — modules stripped to skeletons) ---
  // Uncomment as modules are rebuilt:
  //
  // const authMiddleware = createAuthMiddleware({
  //   supabaseClient: container.supabaseClient,
  //   logger: container.logger,
  // });
  //
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
