import "module-alias/register";
import { config } from "@/config";
import { connectToDatabase } from "@/lib/database";
import { closeWorkers, startWorkers } from "@/workers/ai-workers";

async function startWorkerProcess(): Promise<void> {
  try {
    // Connect to database
    await connectToDatabase();
    console.log("✅ Database connected");

    // Start AI workers
    await startWorkers();
    console.log("✅ AI workers started:");
    console.log("  - Noise removal worker");
    console.log("  - Subtitle generation worker");
    console.log(`🚀 Workers are running in ${config.nodeEnv} mode`);

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log("🛑 Gracefully shutting down workers...");
      await closeWorkers();
      process.exit(0);
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  } catch (error) {
    console.error("❌ Failed to start workers:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startWorkerProcess();
}

export { startWorkerProcess };
