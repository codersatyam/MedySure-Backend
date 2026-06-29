const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  API_VERSION: Joi.string().default('v1'),

  SUPABASE_URL: Joi.string().uri().required(),
  // New Supabase API key format (preferred).
  SUPABASE_PUBLISHABLE_KEY: Joi.string(),
  SUPABASE_SECRET_KEY: Joi.string(),
  SUPABASE_JWKS_URL: Joi.string().uri(),
  // Legacy key format (fallback / backward compatibility).
  SUPABASE_ANON_KEY: Joi.string(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string(),
  SUPABASE_JWT_SECRET: Joi.string(),

  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  APP_URL: Joi.string().uri().default('http://localhost:5173'),
  OAUTH_REDIRECT_URL: Joi.string().uri().optional(),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('debug'),
  LOG_DIR: Joi.string().default('./logs'),

  SMTP_HOST: Joi.string().allow('').default(''),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  EMAIL_FROM: Joi.string().default('noreply@medysure.com'),
}).unknown(true);

const { error, value: env } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const missingVars = error.details.map((d) => d.message).join('\n  ');
  console.error(`\n  Config validation error:\n  ${missingVars}\n`);
  process.exit(1);
}

// Accept either the new (publishable/secret) or legacy (anon/service-role) keys.
const anonKey = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!anonKey || !serviceRoleKey) {
  console.error(
    '\n  Config validation error:\n' +
    '  Supabase keys missing. Set SUPABASE_PUBLISHABLE_KEY + SUPABASE_SECRET_KEY' +
    ' (or the legacy SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY).\n'
  );
  process.exit(1);
}

const config = {
  env: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  isProd: env.NODE_ENV === 'production',
  port: env.PORT,
  apiVersion: env.API_VERSION,

  supabase: {
    url: env.SUPABASE_URL,
    anonKey,
    serviceRoleKey,
    jwksUrl: env.SUPABASE_JWKS_URL,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  },

  cors: {
    origin: env.CORS_ORIGIN,
  },

  appUrl: env.APP_URL,
  // Where Supabase redirects after email confirmation / OAuth. Defaults to the
  // frontend's /auth/callback route.
  oauthRedirectUrl: env.OAUTH_REDIRECT_URL || `${env.APP_URL}/auth/callback`,

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  },

  logging: {
    level: env.LOG_LEVEL,
    dir: env.LOG_DIR,
  },

  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.EMAIL_FROM,
  },
};

module.exports = config;
