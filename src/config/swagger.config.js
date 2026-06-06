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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/*/routes/*.js'],
};

module.exports = swaggerConfig;
