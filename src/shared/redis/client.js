const Redis = require('ioredis');
const redisConfig = require('../../config/redis.config');
const logger = require('../logger');

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      if (process.env.NODE_ENV !== 'test') {
        logger.info('Redis connected');
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err.message);
    });
  }
  return redisClient;
};

const closeRedisClient = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

module.exports = { getRedisClient, closeRedisClient };
