// Supabase OAuth providers we accept on GET /auth/oauth/:provider.
const OAUTH_PROVIDERS = ['google', 'github', 'azure'];

// Wildcard permission that grants full access (held by the Owner group).
const FULL_ACCESS_PERMISSION = '*:*';

module.exports = {
  OAUTH_PROVIDERS,
  FULL_ACCESS_PERMISSION,
};
