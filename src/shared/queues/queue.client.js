const { Queue } = require('bullmq');
const redisConfig = require('../../config/redis.config');

const queues = new Map();

const getQueue = (name) => {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        db: redisConfig.db,
      },
      defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });
    queues.set(name, queue);
  }
  return queues.get(name);
};

const closeAllQueues = async () => {
  for (const [, queue] of queues) {
    await queue.close();
  }
  queues.clear();
};

module.exports = { getQueue, closeAllQueues };
