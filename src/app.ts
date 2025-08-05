import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { config } from "@/config";
import { errorHandler, notFound } from "@/middleware/error";
import { authRoutes } from "@/routes/auth.routes";
import { projectRoutes } from "@/routes/projects.routes";
import { mediaRoutes } from "@/routes/media-assets.routes";
import timelineRoutes from "@/routes/timeline.routes";
import aiJobRoutes from "@/routes/ai-jobs.routes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== "test") {
  app.use(morgan("combined"));
}

app.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.use("/api", authRoutes);
app.use("/api", projectRoutes);
app.use("/api", mediaRoutes);
app.use("/api", timelineRoutes);
app.use("/api", aiJobRoutes);

app.use(notFound);

app.use(errorHandler);

export { app };
