const { Router } = require('express');

const createHealthRoutes = ({ healthController }) => {
  const router = Router();

  // GET /api/v1/health        — liveness: is the server up?
  router.get('/', healthController.liveness);

  // GET /api/v1/health/ready   — readiness: can the server serve traffic?
  router.get('/ready', healthController.readiness);

  return router;
};

module.exports = createHealthRoutes;
