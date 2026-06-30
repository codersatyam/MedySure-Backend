const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const corsOptions = require('./config/cors.config');
const swaggerConfig = require('./config/swagger.config');
const { globalLimiter } = require('./middlewares/rateLimiter.middleware');
const requestIdMiddleware = require('./middlewares/requestId.middleware');
const sanitizeMiddleware = require('./middlewares/sanitize.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const notFoundHandler = require('./middlewares/notFound.middleware');
const { createHealthRoutes } = require('./modules/health');
const { createAuthRoutes } = require('./modules/auth');
const { createDemoRoutes } = require('./modules/demo');
const { createDoctorsRoutes } = require('./modules/doctors');
const createAuthMiddleware = require('./middlewares/auth.middleware');
const { authLimiter, publicFormLimiter } = require('./middlewares/rateLimiter.middleware');


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

  // --- API docs (Swagger UI) ---
  // GET /api/v1/docs        — interactive Swagger UI
  // GET /api/v1/docs.json   — raw OpenAPI spec
  // Prefer the committed swagger.json (source of truth, regenerate via
  // `npm run swagger:gen`); fall back to generating from JSDoc at runtime.
  const swaggerJsonPath = path.join(__dirname, '..', 'swagger.json');
  let openapiSpec;
  try {
    openapiSpec = JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf8'));
  } catch {
    openapiSpec = swaggerJsdoc(swaggerConfig);
  }
  app.get(`${apiPrefix}/docs.json`, (_req, res) => res.json(openapiSpec));
  app.use(`${apiPrefix}/docs`, swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // --- Health check (unauthenticated) ---
  // GET /api/v1/health       — liveness (server is up)
  // GET /api/v1/health/ready  — readiness (server + dependencies are ready)
  app.use(`${apiPrefix}/health`, createHealthRoutes({ healthController: container.healthController }));

  // --- Auth (signup / login / logout / refresh / oauth / me) ---
  const authMiddleware = createAuthMiddleware({
    supabaseClient: container.supabaseClient,
    supabaseAdmin: container.supabaseAdmin,
  });
  app.use(`${apiPrefix}/auth`, createAuthRoutes({
    authController: container.authController,
    authMiddleware,
    authLimiter,
  }));

  // --- Demo requests (public, no auth) ---
  app.use(`${apiPrefix}/demo-requests`, createDemoRoutes({
    demoController: container.demoController,
    demoLimiter: publicFormLimiter,
  }));

  // --- Doctors (authenticated, org-scoped) ---
  app.use(`${apiPrefix}/doctors`, createDoctorsRoutes({
    doctorsController: container.doctorsController,
    authMiddleware,
  }));

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
