import { Router } from "express";
import { TimelineController } from "@/controllers/timeline.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();
const timelineController = new TimelineController();

router.use(authenticate);

router.get("/projects/:projectId/timeline", timelineController.getTimeline.bind(timelineController));
router.put("/projects/:projectId/timeline", timelineController.updateTimeline.bind(timelineController));

export default router;
