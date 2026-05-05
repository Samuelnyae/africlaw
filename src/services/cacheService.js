const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL;
let redis = null;

if (redisUrl) {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  redis.connect().catch(() => null);
}

async function getSession(phoneNumber) {
  if (!redis) return null;
  const raw = await redis.get(`session:${phoneNumber}`);
  return raw ? JSON.parse(raw) : null;
}

async function setSession(phoneNumber, data, ttlSeconds = 3600) {
  if (!redis) return;
  await redis.set(`session:${phoneNumber}`, JSON.stringify(data), 'EX', ttlSeconds);
}

module.exports = {
  getSession,
  setSession,
};
