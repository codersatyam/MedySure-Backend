const { Router } = require('express');
const validate = require('../../../middlewares/validate.middleware');
const {
  signupSchema,
  loginSchema,
  refreshSchema,
  oauthSchema,
} = require('../validators/auth.validator');

const createAuthRoutes = ({ authController, authMiddleware, authLimiter }) => {
  const router = Router();

  // Tighter rate limit on every auth endpoint.
  router.use(authLimiter);

  // --- Public ---

  /**
   * @openapi
   * /auth/signup:
   *   post:
   *     tags: [Auth]
   *     summary: Register a new user
   *     description: >
   *       Creates a Supabase auth user. A database trigger automatically creates
   *       a new organization (derived from the email), a profile, and grants the
   *       user the Owner permission group (full access).
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, firstName]
   *             properties:
   *               email: { type: string, format: email, example: jane@clinic.com }
   *               password: { type: string, minLength: 8, example: Passw0rd123 }
   *               firstName: { type: string, example: Jane }
   *               lastName: { type: string, example: Doe }
   *               orgName: { type: string, example: Jane Clinic }
   *     responses:
   *       201:
   *         description: User registered (session is null if email confirmation is required).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     user: { $ref: '#/components/schemas/AuthUser' }
   *                     session: { $ref: '#/components/schemas/Session' }
   *                     emailConfirmationRequired: { type: boolean }
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  router.post('/signup', validate(signupSchema), authController.signup);

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Sign in with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, format: email, example: jane@clinic.com }
   *               password: { type: string, example: Passw0rd123 }
   *     responses:
   *       200:
   *         description: Authenticated; returns the user and a session.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     user: { $ref: '#/components/schemas/AuthUser' }
   *                     session: { $ref: '#/components/schemas/Session' }
   *       401:
   *         description: Invalid email or password
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  router.post('/login', validate(loginSchema), authController.login);

  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Revoke the current session
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logged out (best-effort).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     message: { type: string, example: Logged out }
   */
  router.post('/logout', authController.logout);

  /**
   * @openapi
   * /auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Exchange a refresh token for a new session
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [refreshToken]
   *             properties:
   *               refreshToken: { type: string }
   *     responses:
   *       200:
   *         description: A fresh session.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     user: { $ref: '#/components/schemas/AuthUser' }
   *                     session: { $ref: '#/components/schemas/Session' }
   *       401:
   *         description: Invalid or expired refresh token
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  router.post('/refresh', validate(refreshSchema), authController.refresh);

  /**
   * @openapi
   * /auth/oauth/{provider}:
   *   get:
   *     tags: [Auth]
   *     summary: Get the OAuth redirect URL for a provider
   *     description: >
   *       Returns the Supabase OAuth URL the frontend should redirect the browser
   *       to. The provider must be enabled in the Supabase dashboard.
   *     parameters:
   *       - in: path
   *         name: provider
   *         required: true
   *         schema: { type: string, enum: [google, github, azure] }
   *     responses:
   *       200:
   *         description: The provider redirect URL.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     url: { type: string, example: 'https://xxxx.supabase.co/auth/v1/authorize?provider=google' }
   *                     provider: { type: string, example: google }
   *       400:
   *         description: Unsupported provider
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  router.get('/oauth/:provider', validate(oauthSchema, 'params'), authController.oauth);

  // --- Protected ---

  /**
   * @openapi
   * /auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Get the current user, organization and effective permissions
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: The authenticated user's profile, organization, groups and permissions.
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
   *                     profile: { type: object }
   *                     organization: { type: object }
   *                     groups:
   *                       type: array
   *                       items: { type: string, example: Owner }
   *                     permissions:
   *                       type: array
   *                       items: { type: string, example: '*:*' }
   *       401:
   *         description: Missing or invalid token
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  router.get('/me', authMiddleware, authController.me);

  return router;
};

module.exports = createAuthRoutes;
