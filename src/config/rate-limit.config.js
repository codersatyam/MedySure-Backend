const config = require('./index');

const globalLimitConfig = {
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
};

const authLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Testing convenience: bypass the auth limiter entirely outside production so
  // repeated sign-in attempts don't trip the 5-per-15-min cap. Production keeps
  // the limit enforced.
  skip: () => !config.isProd,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
};

const apiLimitConfig = {
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'API rate limit exceeded, please slow down.',
    },
  },
};

// Public unauthenticated forms (e.g. demo requests) — keyed by IP to deter spam.
const publicFormLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Only enforce in production (consistent with authLimitConfig) so tests/dev
  // aren't tripped by repeated submissions.
  skip: () => !config.isProd,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
};

module.exports = { globalLimitConfig, authLimitConfig, apiLimitConfig, publicFormLimitConfig };
