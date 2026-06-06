const { UnauthorizedError } = require('../shared/errors');

const createAuthMiddleware = ({ supabaseClient, redisClient, logger }) => {
  return async (req, _res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or invalid authorization header');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new UnauthorizedError('Token not provided');
      }

      // Validate token with Supabase
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      if (error || !user) {
        throw new UnauthorizedError('Invalid or expired token');
      }

      // Check Redis session cache
      const cacheKey = `session:${user.id}`;
      let sessionData = null;

      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          sessionData = JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.warn('Redis session cache read failed', { error: cacheError.message });
      }

      if (!sessionData) {
        // Cache miss - fetch from DB and cache
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const { data: userRoles } = await supabaseClient
          .from('user_roles')
          .select(`
            roles (
              name,
              role_permissions (
                permissions (resource, action)
              )
            )
          `)
          .eq('user_id', user.id);

        const roles = userRoles?.map((ur) => ur.roles.name) || [];
        const permissions = [];
        userRoles?.forEach((ur) => {
          ur.roles.role_permissions?.forEach((rp) => {
            permissions.push(`${rp.permissions.resource}:${rp.permissions.action}`);
          });
        });

        sessionData = {
          id: user.id,
          email: user.email,
          profile,
          roles,
          permissions: [...new Set(permissions)],
        };

        // Cache session
        try {
          await redisClient.setex(cacheKey, 3600, JSON.stringify(sessionData));
        } catch (cacheError) {
          logger.warn('Redis session cache write failed', { error: cacheError.message });
        }
      }

      req.user = sessionData;
      next();
    } catch (err) {
      if (err.isOperational) {
        return next(err);
      }
      next(new UnauthorizedError('Authentication failed'));
    }
  };
};

module.exports = createAuthMiddleware;
