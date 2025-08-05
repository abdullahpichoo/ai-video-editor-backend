import { config } from "@/config";
import { Queue } from "bullmq";
import Redis, { RedisOptions } from "ioredis";

const redisOptions: RedisOptions = {
  host: config.redis.host,
  port: config.redis.port,
};

console.log("🔗 Connecting to Redis:", {
  host: config.redis.host,
  port: config.redis.port,
  hasPassword: !!config.redis.password,
});

export const redisConnection = new Redis(redisOptions);

export const subtitleGenerationQueue = new Queue("subtitleGeneration", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const noiseRemovalQueue = new Queue("noiseRemoval", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

redisConnection.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisConnection.on("error", (error) => {
  console.error("❌ Redis connection error:", error);
});

redisConnection.on("close", () => {
  console.log("🔌 Redis connection closed");
});

noiseRemovalQueue.on("error", (error) => {
  console.error("❌ Noise removal queue error:", error);
});

subtitleGenerationQueue.on("error", (error) => {
  console.error("❌ Subtitle queue error:", error);
});

export const getRedisConnection = (): Redis => {
  if (!redisConnection) {
    throw new Error("Redis connection is not initialized");
  }
  return redisConnection;
};

export const closeRedisConnection = async (): Promise<void> => {
  if (redisConnection) {
    await redisConnection.quit();
    console.log("🔌 Redis connection closed gracefully");
  }
};

export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const result = await redisConnection.ping();
    return result === "PONG";
  } catch (error) {
    console.error("❌ Redis health check failed:", error);
    return false;
  }
};
