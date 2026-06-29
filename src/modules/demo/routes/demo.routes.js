const { Router } = require('express');
const validate = require('../../../middlewares/validate.middleware');
const { demoRequestSchema } = require('../validators/demo.validator');

const createDemoRoutes = ({ demoController, demoLimiter }) => {
  const router = Router();

  // Rate limit this public form to deter spam/abuse.
  router.use(demoLimiter);

  /**
   * @openapi
   * /demo-requests:
   *   post:
   *     tags: [Demo]
   *     summary: Request a product demo (public, no auth)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, phoneNo]
   *             properties:
   *               name: { type: string, maxLength: 100, example: Jane Doe }
   *               email: { type: string, format: email, example: jane@clinic.com }
   *               phoneNo: { type: string, example: '+919876543210' }
   *     responses:
   *       201:
   *         description: Demo request captured.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     id: { type: string, format: uuid }
   *                     createdAt: { type: string, format: date-time }
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   *       429:
   *         description: Too many requests
   */
  router.post('/', validate(demoRequestSchema), demoController.create);

  return router;
};

module.exports = createDemoRoutes;
