const { authorize } = require('../../../src/middlewares/rbac.middleware');
const { createMockRequest, createMockResponse, createMockNext } = require('../../helpers/mocks');

describe('RBAC Middleware', () => {
  describe('authorize', () => {
    it('should allow access if user has required permission', () => {
      const middleware = authorize('patients:read');
      const req = createMockRequest({
        user: { permissions: ['patients:read', 'patients:write'] },
      });
      const next = createMockNext();

      middleware(req, createMockResponse(), next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access if user lacks permission', () => {
      const middleware = authorize('patients:write');
      const req = createMockRequest({
        user: { permissions: ['patients:read'] },
      });
      const next = createMockNext();

      middleware(req, createMockResponse(), next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });

    it('should allow full-access (*:*) holders to bypass all checks', () => {
      const middleware = authorize('patients:write');
      const req = createMockRequest({
        user: { permissions: ['*:*'] },
      });
      const next = createMockNext();

      middleware(req, createMockResponse(), next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access when user is not authenticated', () => {
      const middleware = authorize('patients:read');
      const req = createMockRequest({ user: undefined });
      const next = createMockNext();

      middleware(req, createMockResponse(), next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });
  });
});
