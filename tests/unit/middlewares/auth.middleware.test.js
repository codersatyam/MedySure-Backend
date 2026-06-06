const createAuthMiddleware = require('../../../src/middlewares/auth.middleware');
const { createMockSupabaseClient, createMockRedisClient, createMockLogger, createMockRequest, createMockResponse, createMockNext } = require('../../helpers/mocks');

describe('Auth Middleware', () => {
  let authMiddleware;
  let mockSupabase;
  let mockRedis;
  let mockLogger;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockRedis = createMockRedisClient();
    mockLogger = createMockLogger();

    authMiddleware = createAuthMiddleware({
      supabaseClient: mockSupabase,
      redisClient: mockRedis,
      logger: mockLogger,
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

  it('should set req.user from Redis cache if available', async () => {
    const cachedSession = {
      id: 'user-123',
      email: 'test@test.com',
      roles: ['admin'],
      permissions: ['patient:read'],
    };

    const req = createMockRequest({
      headers: { authorization: 'Bearer valid-token' },
    });
    const next = createMockNext();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockRedis.get.mockResolvedValue(JSON.stringify(cachedSession));

    await authMiddleware(req, createMockResponse(), next);

    expect(req.user).toEqual(cachedSession);
    expect(next).toHaveBeenCalledWith();
  });
});
