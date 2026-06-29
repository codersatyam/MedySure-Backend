const request = require('supertest');
const createApp = require('../../src/app');
const { DemoController } = require('../../src/modules/demo');
const { AuthController } = require('../../src/modules/auth');
const { createMockSupabaseClient } = require('../helpers/mocks');

const buildApp = () => {
  const demoService = {
    requestDemo: jest.fn().mockResolvedValue({ id: 'd1', createdAt: '2026-06-29T00:00:00Z' }),
  };

  const container = {
    supabaseClient: createMockSupabaseClient(),
    supabaseAdmin: createMockSupabaseClient(),
    healthController: { liveness: (_q, r) => r.json({ ok: true }), readiness: (_q, r) => r.json({ ok: true }) },
    authController: new AuthController({ authService: {} }),
    demoController: new DemoController({ demoService }),
  };

  return { app: createApp(container), demoService };
};

describe('Demo request routes', () => {
  it('POST /api/v1/demo-requests creates a request with valid data', async () => {
    const { app, demoService } = buildApp();

    const res = await request(app)
      .post('/api/v1/demo-requests')
      .send({ name: 'Jane Doe', email: 'jane@clinic.com', phoneNo: '+919876543210' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: { id: 'd1', createdAt: '2026-06-29T00:00:00Z' },
    });
    expect(demoService.requestDemo).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@clinic.com',
      phoneNo: '+919876543210',
    });
  });

  it('rejects a missing/invalid field with 400', async () => {
    const { app } = buildApp();

    const res = await request(app)
      .post('/api/v1/demo-requests')
      .send({ name: 'Jane Doe', email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
