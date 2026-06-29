const createMockSupabaseClient = () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    from: jest.fn(() => mockQuery),
    auth: {
      getUser: jest.fn(),
      admin: {
        createUser: jest.fn(),
        updateUserById: jest.fn(),
        signOut: jest.fn(),
      },
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    rpc: jest.fn(),
    _mockQuery: mockQuery,
  };
};

const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
});

const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  requestId: 'test-request-id',
  ip: '127.0.0.1',
  method: 'GET',
  path: '/test',
  originalUrl: '/test',
  ...overrides,
});

const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
};

const createMockNext = () => jest.fn();

module.exports = {
  createMockSupabaseClient,
  createMockLogger,
  createMockRequest,
  createMockResponse,
  createMockNext,
};
