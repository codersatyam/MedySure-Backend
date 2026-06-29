// Generates a static OpenAPI spec (swagger.json) from the @openapi JSDoc
// annotations on the route files. Run with: npm run swagger:gen
const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerConfig = require('../src/config/swagger.config');

const spec = swaggerJsdoc(swaggerConfig);
const outPath = path.join(__dirname, '..', 'swagger.json');

fs.writeFileSync(outPath, `${JSON.stringify(spec, null, 2)}\n`);

const routeCount = Object.values(spec.paths || {}).reduce(
  (sum, methods) => sum + Object.keys(methods).length,
  0
);
console.log(`Wrote ${outPath} (${Object.keys(spec.paths || {}).length} paths, ${routeCount} operations).`);
