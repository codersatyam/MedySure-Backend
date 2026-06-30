const request = require('supertest');
const createApp = require('../../src/app');
const { AuthController } = require('../../src/modules/auth');
const { DemoController } = require('../../src/modules/demo');
const { DoctorsController } = require('../../src/modules/doctors');
const { createMockSupabaseClient } = require('../helpers/mocks');

// Minimal container: a real AuthController backed by a stub service, plus the
// supabase clients the auth middleware needs and no-op health/demo controllers.
const buildApp = () => {
  const supabaseClient = createMockSupabaseClient();

  const authService = {
    getOAuthUrl: jest.fn().mockResolvedValue({
      url: 'https://provider/oauth?x=1',
      provider: 'google',
    }),
  };

  const container = {
    supabaseClient,
    supabaseAdmin: createMockSupabaseClient(),
    healthController: { liveness: (_req, res) => res.json({ ok: true }), readiness: (_req, res) => res.json({ ok: true }) },
    authController: new AuthController({ authService }),
    demoController: new DemoController({ demoService: {} }),
    doctorsController: new DoctorsController({ doctorsService: {} }),
  };

  return { app: createApp(container), supabaseClient };
};

describe('Auth routes', () => {
  it('POST /api/v1/auth/signup rejects an invalid body with 400', async () => {
    const { app } = buildApp();

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/auth/me without a token returns 401', async () => {
    const { app } = buildApp();

    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/oauth/:provider returns the provider URL', async () => {
    const { app } = buildApp();

    const res = await request(app).get('/api/v1/auth/oauth/google');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { url: 'https://provider/oauth?x=1', provider: 'google' },
    });
  });

  it('GET /api/v1/auth/oauth/:provider rejects an unknown provider with 400', async () => {
    const { app } = buildApp();

    const res = await request(app).get('/api/v1/auth/oauth/myspace');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
