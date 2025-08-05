import { Router } from "express";
import { AIJobController } from "@/controllers/ai-job.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();
const aiJobController = new AIJobController();

router.use(authenticate);

router.post("/ai/noise-removal", aiJobController.startNoiseRemoval.bind(aiJobController));
router.post("/ai/subtitle-generation", aiJobController.startSubtitleGeneration.bind(aiJobController));
router.get("/ai/jobs/:jobId", aiJobController.getJobStatus.bind(aiJobController));
router.get("/ai/jobs", aiJobController.getUserJobs.bind(aiJobController));

export default router;
