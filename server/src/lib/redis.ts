import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

// Only create Redis client if REDIS_URL is provided
export const redisClient = redisUrl ? createClient({
  url: redisUrl,
}) : null;

if (redisClient) {
  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });

  // Connect to Redis
  if (!redisClient.isOpen) {
    redisClient.connect().catch((err) => {
      console.error('Failed to connect to Redis:', err.message);
    });
  }
} else {
  console.warn('Redis not configured: REDIS_URL not provided. Redis features will be disabled.');
}

export default redisClient;

