const AuthService = require('../../../../src/modules/auth/services/auth.service');
const { createMockSupabaseClient, createMockLogger } = require('../../../helpers/mocks');

describe('AuthService', () => {
  let service;
  let supabaseClient;
  let supabaseAdmin;
  let logger;
  const config = { oauthRedirectUrl: 'http://localhost:5173/auth/callback' };

  beforeEach(() => {
    supabaseClient = createMockSupabaseClient();
    supabaseAdmin = createMockSupabaseClient();
    logger = createMockLogger();
    service = new AuthService({ supabaseClient, supabaseAdmin, logger, config });
  });

  describe('signup', () => {
    it('registers the user and reports a session', async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'u1', email: 'a@b.com' },
          session: { access_token: 'tok' },
        },
        error: null,
      });

      const result = await service.signup({
        email: 'a@b.com',
        password: 'secret123',
        firstName: 'Ann',
        lastName: 'Lee',
        orgName: 'Clinic',
      });

      expect(result.user.id).toBe('u1');
      expect(result.emailConfirmationRequired).toBe(false);
      expect(supabaseClient.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'a@b.com',
          password: 'secret123',
          options: expect.objectContaining({
            data: { first_name: 'Ann', last_name: 'Lee', org_name: 'Clinic' },
          }),
        })
      );
    });

    it('flags email confirmation when no session is returned', async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { id: 'u1', email: 'a@b.com' }, session: null },
        error: null,
      });

      const result = await service.signup({
        email: 'a@b.com',
        password: 'secret123',
        firstName: 'Ann',
      });

      expect(result.emailConfirmationRequired).toBe(true);
    });

    it('maps a duplicate-user error to a 400', async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: {},
        error: { message: 'User already registered', status: 422 },
      });

      await expect(
        service.signup({ email: 'a@b.com', password: 'secret123', firstName: 'Ann' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('login', () => {
    it('returns a session on success', async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 'tok' } },
        error: null,
      });

      const result = await service.login({ email: 'a@b.com', password: 'secret123' });
      expect(result.session.access_token).toBe('tok');
    });

    it('throws 401 on invalid credentials', async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials', status: 400 },
      });

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' })
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('refresh', () => {
    it('throws 401 when the refresh token is invalid', async () => {
      supabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid' },
      });

      await expect(service.refresh('bad')).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('getOAuthUrl', () => {
    it('returns the provider redirect URL', async () => {
      supabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://provider/oauth?x=1' },
        error: null,
      });

      const result = await service.getOAuthUrl('google');
      expect(result).toEqual({ url: 'https://provider/oauth?x=1', provider: 'google' });
    });
  });

  describe('getMe', () => {
    it('throws 401 when the profile is missing', async () => {
      supabaseAdmin._mockQuery.single.mockResolvedValue({ data: null, error: null });

      await expect(service.getMe('u1')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('returns profile, organization and permissions', async () => {
      supabaseAdmin._mockQuery.single.mockResolvedValue({
        data: {
          id: 'u1',
          org_id: 'org1',
          first_name: 'Ann',
          organizations: { id: 'org1', name: 'Clinic' },
        },
        error: null,
      });

      const result = await service.getMe('u1');
      expect(result.organization).toEqual({ id: 'org1', name: 'Clinic' });
      expect(result.profile).not.toHaveProperty('organizations');
      expect(Array.isArray(result.permissions)).toBe(true);
    });
  });
});
