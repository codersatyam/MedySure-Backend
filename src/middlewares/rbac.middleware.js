const { ForbiddenError } = require('../shared/errors');

// Full-access wildcard granted via the Owner permission group.
const FULL_ACCESS = '*:*';

const authorize = (...requiredPermissions) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    const userPermissions = req.user.permissions || [];

    // Holders of the full-access wildcard bypass all permission checks.
    if (userPermissions.includes(FULL_ACCESS)) {
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

module.exports = { authorize };
