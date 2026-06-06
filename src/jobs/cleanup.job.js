const logger = require('../shared/logger');

const createCleanupJob = ({ redisClient, notificationRepository }) => {
  return async () => {
    logger.info('Running cleanup job');

    try {
      // Clean expired sessions from Redis
      // (Redis handles TTL automatically, but we can clean orphaned keys)
      const sessionKeys = await redisClient.keys('session:*');
      let cleaned = 0;
      for (const key of sessionKeys) {
        const ttl = await redisClient.ttl(key);
        if (ttl === -1) {
          await redisClient.del(key);
          cleaned++;
        }
      }

      // Clean old read notifications (older than 90 days)
      if (notificationRepository) {
        await notificationRepository.deleteOlderThan(90);
      }

      logger.info('Cleanup job completed', { sessionsCleaned: cleaned });
    } catch (err) {
      logger.error('Cleanup job failed', { error: err.message });
    }
  };
};

module.exports = createCleanupJob;
