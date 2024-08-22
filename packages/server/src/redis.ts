import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

if (!redisClient) {
  throw new Error("Redis client not found");
}

export default redisClient;
