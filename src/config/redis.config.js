const config = require('./index');

const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  db: config.redis.db,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 200, 2000);
  },
};

if (config.redis.password) {
  redisConfig.password = config.redis.password;
}

if (config.redis.tls) {
  redisConfig.tls = {};
}

module.exports = redisConfig;
