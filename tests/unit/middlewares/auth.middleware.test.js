const createAuthMiddleware = require('../../../src/middlewares/auth.middleware');
const { createMockSupabaseClient, createMockRequest, createMockResponse, createMockNext } = require('../../helpers/mocks');

describe('Auth Middleware', () => {
  let authMiddleware;
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();

    authMiddleware = createAuthMiddleware({
      supabaseClient: mockSupabase,
    });
  });

  it('should return 401 if no authorization header', async () => {
    const req = createMockRequest({ headers: {} });
    const next = createMockNext();

    await authMiddleware(req, createMockResponse(), next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should return 401 if token is invalid', async () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer invalid-token' },
    });
    const next = createMockNext();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    await authMiddleware(req, createMockResponse(), next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should build req.user from the database when the token is valid', async () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer valid-token' },
    });
    const next = createMockNext();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    await authMiddleware(req, createMockResponse(), next);

    expect(req.user).toEqual({
      id: 'user-123',
      email: 'test@test.com',
      profile: null,
      roles: [],
      permissions: [],
    });
    expect(next).toHaveBeenCalledWith();
  });
});
