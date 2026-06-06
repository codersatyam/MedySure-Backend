const { authorize, authorizeRoles } = require('../../../src/middlewares/rbac.middleware');
const { createMockRequest, createMockResponse, createMockNext } = require('../../helpers/mocks');

describe('RBAC Middleware', () => {
  describe('authorize', () => {
    it('should allow access if user has required permission', () => {
      const middleware = authorize('patient:read');
      const req = createMockRequest({
        user: { roles: ['doctor'], permissions: ['patient:read', 'patient:list'] },
      });
      const next = createMockNext();

      middleware(req, createMockResponse(), next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access if user lacks permission', () => {
      const middleware = authorize('patient:delete');
      const req = createMockRequest({
        user: { roles: ['doctor'], permissions: ['patient:read'] },
      });
      const next = createMockNext();

      middleware(req, createMockResponse(), next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });

    it('should allow super_admin to bypass all checks', () => {
      const middleware = authorize('patient:delete');
      const req = createMockRequest({
        user: { roles: ['super_admin'], permissions: [] },
      });
      const next = createMockNext();

      middleware(req, createMockResponse(), next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('authorizeRoles', () => {
    it('should allow access if user has required role', () => {
      const middleware = authorizeRoles('admin', 'doctor');
      const req = createMockRequest({
        user: { roles: ['doctor'], permissions: [] },
      });
      const next = createMockNext();

      middleware(req, createMockResponse(), next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access if user lacks required role', () => {
      const middleware = authorizeRoles('admin');
      const req = createMockRequest({
        user: { roles: ['patient'], permissions: [] },
      });
      const next = createMockNext();

      middleware(req, createMockResponse(), next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });
  });
});
