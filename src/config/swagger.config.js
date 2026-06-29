const config = require('./index');

const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MedySure API',
      version: '1.0.0',
      description: 'MedySure Healthcare Management Platform API',
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Sign up, sign in and session management' },
      { name: 'Demo', description: 'Public demo-request capture' },
      { name: 'Health', description: 'Liveness and readiness probes' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Session: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresAt: { type: 'integer', example: 1735689600 },
            tokenType: { type: 'string', example: 'bearer' },
          },
        },
        AuthUser: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Endpoints are public by default; protected ones declare security per-operation.
    security: [],
  },
  apis: ['./src/modules/*/routes/*.js'],
};

module.exports = swaggerConfig;
