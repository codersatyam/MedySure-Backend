const express = require('express');
const { createMockSupabaseClient, createMockRedisClient, createMockLogger, createMockQueue } = require('./mocks');

const createTestApp = (routeSetup) => {
  const app = express();
  app.use(express.json());

  if (routeSetup) {
    routeSetup(app);
  }

  // Error handler
  app.use((err, _req, res, _next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Internal Server Error',
      },
    });
  });

  return app;
};

const createTestDependencies = () => ({
  supabaseClient: createMockSupabaseClient(),
  supabaseAdmin: createMockSupabaseClient(),
  redisClient: createMockRedisClient(),
  logger: createMockLogger(),
  notificationQueue: createMockQueue(),
  emailQueue: createMockQueue(),
});

module.exports = { createTestApp, createTestDependencies };
