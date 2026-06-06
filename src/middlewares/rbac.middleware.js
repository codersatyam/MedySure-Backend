const { ForbiddenError } = require('../shared/errors');

const authorize = (...requiredPermissions) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    const userPermissions = req.user.permissions || [];

    // Super admin bypasses all permission checks
    if (req.user.roles && req.user.roles.includes('super_admin')) {
      return next();
    }

    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `Missing required permissions: ${requiredPermissions.join(', ')}`
        )
      );
    }

    next();
  };
};

const authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(new ForbiddenError('Insufficient role privileges'));
    }

    next();
  };
};

module.exports = { authorize, authorizeRoles };
