const { ValidationError, UnauthorizedError, AppError } = require('../../../shared/errors');
const { loadUserPermissions } = require('../../../shared/utils/permissions');

// Maps a Supabase auth error into one of our operational error classes.
const toAuthError = (error, fallbackMessage) => {
  const message = error?.message || fallbackMessage;
  const status = error?.status;

  if (status === 401 || status === 403) {
    return new UnauthorizedError(message);
  }
  if (status === 400 || status === 409 || status === 422) {
    return new ValidationError(message);
  }
  return new AppError(message || 'Authentication error', status || 500, 'AUTH_ERROR');
};

class AuthService {
  constructor({ supabaseClient, supabaseAdmin, logger, config }) {
    this.supabaseClient = supabaseClient;
    this.supabaseAdmin = supabaseAdmin;
    this.logger = logger;
    this.config = config;
  }

  // Email/password signup. The on_auth_user_created DB trigger creates the
  // organization + profile + Owner group, so this just registers the user.
  async signup({ email, password, firstName, lastName, orgName }) {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          ...(orgName ? { org_name: orgName } : {}),
        },
        emailRedirectTo: this.config.oauthRedirectUrl,
      },
    });

    if (error) {
      throw toAuthError(error, 'Signup failed');
    }

    return {
      user: data.user,
      session: data.session,
      // When email confirmation is enabled, session is null until confirmed.
      emailConfirmationRequired: !data.session,
    };
  }

  async login({ email, password }) {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return { user: data.user, session: data.session };
  }

  // Best-effort: revoke the session for the given access token.
  async logout(accessToken) {
    if (!accessToken) {
      return;
    }
    try {
      await this.supabaseAdmin.auth.admin.signOut(accessToken);
    } catch (err) {
      this.logger.warn('Logout sign-out call failed', { message: err.message });
    }
  }

  async refresh(refreshToken) {
    const { data, error } = await this.supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    return { user: data.user, session: data.session };
  }

  // Returns the provider URL the frontend should redirect the browser to.
  async getOAuthUrl(provider) {
    const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: this.config.oauthRedirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      throw toAuthError(error, 'Could not start OAuth flow');
    }

    return { url: data.url, provider };
  }

  // Current user: profile + organization + effective permissions/groups.
  async getMe(userId) {
    const { data: profile, error } = await this.supabaseAdmin
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new UnauthorizedError('User profile not found');
    }

    const { organizations: organization, ...profileFields } = profile;
    const { permissions, groups } = await loadUserPermissions(this.supabaseAdmin, userId);

    return {
      id: userId,
      profile: profileFields,
      organization: organization || null,
      groups,
      permissions,
    };
  }
}

module.exports = AuthService;
