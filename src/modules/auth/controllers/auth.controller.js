const { sendSuccess, sendCreated } = require('../../../shared/utils/response');

// Shapes a Supabase session into the minimal token payload the client needs.
const toSessionPayload = (session) => {
  if (!session) {
    return null;
  }
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    tokenType: session.token_type,
  };
};

class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  signup = async (req, res, next) => {
    try {
      const { user, session, emailConfirmationRequired } = await this.authService.signup(req.body);
      return sendCreated(res, {
        user: { id: user?.id, email: user?.email },
        session: toSessionPayload(session),
        emailConfirmationRequired,
      });
    } catch (err) {
      return next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const { user, session } = await this.authService.login(req.body);
      return sendSuccess(res, {
        user: { id: user?.id, email: user?.email },
        session: toSessionPayload(session),
      });
    } catch (err) {
      return next(err);
    }
  };

  logout = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const accessToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
      await this.authService.logout(accessToken);
      return sendSuccess(res, { message: 'Logged out' });
    } catch (err) {
      return next(err);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const { user, session } = await this.authService.refresh(req.body.refreshToken);
      return sendSuccess(res, {
        user: { id: user?.id, email: user?.email },
        session: toSessionPayload(session),
      });
    } catch (err) {
      return next(err);
    }
  };

  oauth = async (req, res, next) => {
    try {
      const result = await this.authService.getOAuthUrl(req.params.provider);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };

  me = async (req, res, next) => {
    try {
      const result = await this.authService.getMe(req.user.id);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = AuthController;
