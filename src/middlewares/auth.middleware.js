const { UnauthorizedError } = require('../shared/errors');
const { loadUserPermissions } = require('../shared/utils/permissions');

const createAuthMiddleware = ({ supabaseClient, supabaseAdmin }) => {
  // Reads use the admin client so they aren't subject to RLS on profiles /
  // permission tables (and don't expose PII through the anon client).
  const db = supabaseAdmin || supabaseClient;
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

      // Profile (carries org membership)
      const { data: profile } = await db
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Effective permissions = assigned groups UNION direct grants
      const { permissions, groups } = await loadUserPermissions(db, user.id);

      req.user = {
        id: user.id,
        email: user.email,
        profile,
        orgId: profile?.org_id || null,
        groups,
        permissions,
      };
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
