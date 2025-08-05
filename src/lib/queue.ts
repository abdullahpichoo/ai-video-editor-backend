import { Queue, Worker, QueueOptions, WorkerOptions } from "bullmq";
import Redis from "ioredis";
import { config } from "@/config";

// Redis connection configuration
const redisConfig = {
  host: config.redis?.host || "localhost",
  port: config.redis?.port || 6379,
  ...(config.redis?.password && { password: config.redis.password }),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
};

// Create Redis connections
export const redis = new Redis(redisConfig);

// Queue configuration
const queueConfig: QueueOptions = {
  connection: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 10,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
};

// AI Processing Queues
export const noiseRemovalQueue = new Queue("noise-removal", queueConfig);
export const subtitleGenerationQueue = new Queue("subtitle-generation", queueConfig);

// Worker configuration
const workerConfig: WorkerOptions = {
  connection: redisConfig,
  concurrency: 2, // Process 2 jobs simultaneously per worker
};

export { workerConfig, redisConfig };

export async function closeQueues(): Promise<void> {
  await Promise.all([noiseRemovalQueue.close(), subtitleGenerationQueue.close(), redis.quit()]);
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Closing queues...");
  await closeQueues();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Closing queues...");
  await closeQueues();
  process.exit(0);
});
