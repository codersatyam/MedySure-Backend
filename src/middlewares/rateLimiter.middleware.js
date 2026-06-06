const rateLimit = require('express-rate-limit');
const { globalLimitConfig, authLimitConfig, apiLimitConfig } = require('../config/rate-limit.config');

const createRateLimiter = (config) => {
  return rateLimit(config);
};

const globalLimiter = createRateLimiter(globalLimitConfig);
const authLimiter = createRateLimiter(authLimitConfig);
const apiLimiter = createRateLimiter(apiLimitConfig);

module.exports = { globalLimiter, authLimiter, apiLimiter, createRateLimiter };
