import "module-alias/register";
import { app } from "./app";
import { config } from "@/config";
import { initializeDatabase, checkDatabaseHealth } from "@/lib/database";

const startServer = async (): Promise<void> => {
  try {
    // Check database connection
    console.log("Checking database connection...");
    const isDbHealthy = await checkDatabaseHealth();

    if (!isDbHealthy) {
      throw new Error("Database health check failed");
    }

    // Initialize database indexes
    console.log("Initializing database...");
    await initializeDatabase();

    // Start the server
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📱 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Database: ${config.mongodb.dbName}`);
      console.log(`🌐 CORS Origin: ${config.cors.origin}`);

      if (config.nodeEnv === "development") {
        console.log(`🔍 API Health Check: http://localhost:${config.port}/health`);
        console.log(`🔐 Auth API: http://localhost:${config.port}/api/auth`);
        console.log(`📁 Projects API: http://localhost:${config.port}/api/projects`);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception thrown:", error);
  process.exit(1);
});

// Start the server
startServer();
