const request = require('supertest');

// Stub permission loading so the authenticated user has the staff grants the
// doctor routes require. (Keeps the test focused on route wiring, not RBAC data.)
jest.mock('../../src/shared/utils/permissions', () => ({
  loadUserPermissions: jest
    .fn()
    .mockResolvedValue({ permissions: ['staff:read', 'staff:write'], groups: ['Owner'] }),
}));

const createApp = require('../../src/app');
const { AuthController } = require('../../src/modules/auth');
const { DemoController } = require('../../src/modules/demo');
const { DoctorsController } = require('../../src/modules/doctors');
const { createMockSupabaseClient } = require('../helpers/mocks');

const ORG_ID = 'org-1';
const TOKEN = 'Bearer valid-token';

const buildApp = (doctorsService) => {
  const supabaseClient = createMockSupabaseClient();
  const supabaseAdmin = createMockSupabaseClient();

  // Valid bearer token → an authenticated user.
  supabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: 'u1', email: 'admin@clinic.com' } },
    error: null,
  });
  // Profile lookup (via admin client) carries the org membership.
  supabaseAdmin._mockQuery.single.mockResolvedValue({
    data: { id: 'u1', org_id: ORG_ID },
    error: null,
  });

  const container = {
    supabaseClient,
    supabaseAdmin,
    healthController: { liveness: (_q, r) => r.json({ ok: true }), readiness: (_q, r) => r.json({ ok: true }) },
    authController: new AuthController({ authService: {} }),
    demoController: new DemoController({ demoService: {} }),
    doctorsController: new DoctorsController({ doctorsService }),
  };

  return createApp(container);
};

describe('Doctor routes', () => {
  it('POST /api/v1/doctors requires authentication (401 without token)', async () => {
    const app = buildApp({});

    const res = await request(app)
      .post('/api/v1/doctors')
      .send({ firstName: 'Asha', lastName: 'Verma' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/doctors requires authentication (401 without token)', async () => {
    const app = buildApp({});

    const res = await request(app).get('/api/v1/doctors');

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/doctors creates a doctor scoped to the caller org', async () => {
    const doctorsService = {
      addDoctor: jest.fn().mockResolvedValue({ id: 'doc-1', firstName: 'Asha', lastName: 'Verma' }),
    };
    const app = buildApp(doctorsService);

    const body = {
      firstName: 'Asha',
      lastName: 'Verma',
      specialization: 'Cardiology',
      qualification: ['MBBS', 'MD'],
      age: 42,
      totalExperience: 12.5,
      consultingFees: 800,
    };

    const res = await request(app).post('/api/v1/doctors').set('Authorization', TOKEN).send(body);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, data: { id: 'doc-1', firstName: 'Asha', lastName: 'Verma' } });
    // orgId comes from the token, not the body.
    expect(doctorsService.addDoctor).toHaveBeenCalledWith(ORG_ID, expect.objectContaining(body));
  });

  it('POST /api/v1/doctors rejects an invalid body with 400', async () => {
    const app = buildApp({ addDoctor: jest.fn() });

    const res = await request(app)
      .post('/api/v1/doctors')
      .set('Authorization', TOKEN)
      .send({ lastName: 'Verma' }); // missing firstName

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/doctors lists doctors for the caller org', async () => {
    const doctorsService = {
      listDoctors: jest.fn().mockResolvedValue([{ id: 'doc-1', firstName: 'Asha' }]),
    };
    const app = buildApp(doctorsService);

    const res = await request(app).get('/api/v1/doctors').set('Authorization', TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [{ id: 'doc-1', firstName: 'Asha' }] });
    expect(doctorsService.listDoctors).toHaveBeenCalledWith(ORG_ID);
  });

  const DOC_ID = '11111111-1111-1111-1111-111111111111';

  it('PATCH /api/v1/doctors/:id updates the doctor (org-scoped)', async () => {
    const doctorsService = {
      updateDoctor: jest.fn().mockResolvedValue({ id: DOC_ID, consultingFees: 950 }),
    };
    const app = buildApp(doctorsService);

    const res = await request(app)
      .patch(`/api/v1/doctors/${DOC_ID}`)
      .set('Authorization', TOKEN)
      .send({ consultingFees: 950 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { id: DOC_ID, consultingFees: 950 } });
    expect(doctorsService.updateDoctor).toHaveBeenCalledWith(ORG_ID, DOC_ID, { consultingFees: 950 });
  });

  it('PATCH /api/v1/doctors/:id rejects an empty body with 400', async () => {
    const app = buildApp({ updateDoctor: jest.fn() });

    const res = await request(app)
      .patch(`/api/v1/doctors/${DOC_ID}`)
      .set('Authorization', TOKEN)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /api/v1/doctors/:id rejects a non-uuid id with 400', async () => {
    const app = buildApp({ updateDoctor: jest.fn() });

    const res = await request(app)
      .patch('/api/v1/doctors/not-a-uuid')
      .set('Authorization', TOKEN)
      .send({ consultingFees: 950 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /api/v1/doctors/:id requires authentication (401)', async () => {
    const app = buildApp({ updateDoctor: jest.fn() });

    const res = await request(app).patch(`/api/v1/doctors/${DOC_ID}`).send({ consultingFees: 1 });

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/doctors/:id/photo uploads a valid image', async () => {
    const doctorsService = {
      uploadDoctorPhoto: jest
        .fn()
        .mockResolvedValue({ id: DOC_ID, photoUrl: 'https://cdn.test/p.png' }),
    };
    const app = buildApp(doctorsService);

    const res = await request(app)
      .post(`/api/v1/doctors/${DOC_ID}/photo`)
      .set('Authorization', TOKEN)
      .attach('photo', Buffer.from('fake-png-bytes'), 'avatar.png');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { id: DOC_ID, photoUrl: 'https://cdn.test/p.png' } });
    expect(doctorsService.uploadDoctorPhoto).toHaveBeenCalledWith(ORG_ID, DOC_ID, expect.any(Object));
  });

  it('POST /api/v1/doctors/:id/photo rejects a file larger than 2MB with 400', async () => {
    const doctorsService = { uploadDoctorPhoto: jest.fn() };
    const app = buildApp(doctorsService);

    const tooLarge = Buffer.alloc(2 * 1024 * 1024 + 1, 1); // 2MB + 1 byte

    const res = await request(app)
      .post(`/api/v1/doctors/${DOC_ID}/photo`)
      .set('Authorization', TOKEN)
      .attach('photo', tooLarge, 'big.png');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    expect(doctorsService.uploadDoctorPhoto).not.toHaveBeenCalled();
  });

  it('POST /api/v1/doctors/:id/photo rejects an unsupported file type with 400', async () => {
    const doctorsService = { uploadDoctorPhoto: jest.fn() };
    const app = buildApp(doctorsService);

    const res = await request(app)
      .post(`/api/v1/doctors/${DOC_ID}/photo`)
      .set('Authorization', TOKEN)
      .attach('photo', Buffer.from('hello'), { filename: 'note.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
    expect(doctorsService.uploadDoctorPhoto).not.toHaveBeenCalled();
  });

  it('POST /api/v1/doctors/:id/photo returns 400 when no file is attached', async () => {
    const doctorsService = { uploadDoctorPhoto: jest.fn() };
    const app = buildApp(doctorsService);

    const res = await request(app).post(`/api/v1/doctors/${DOC_ID}/photo`).set('Authorization', TOKEN);

    expect(res.status).toBe(400);
    expect(doctorsService.uploadDoctorPhoto).not.toHaveBeenCalled();
  });

  it('POST /api/v1/doctors/:id/photo requires authentication (401)', async () => {
    const app = buildApp({ uploadDoctorPhoto: jest.fn() });

    const res = await request(app)
      .post(`/api/v1/doctors/${DOC_ID}/photo`)
      .attach('photo', Buffer.from('x'), 'a.png');

    expect(res.status).toBe(401);
  });
});
