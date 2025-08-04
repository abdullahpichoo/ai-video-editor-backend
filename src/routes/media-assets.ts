import { Router } from "express";
import { MediaController } from "@/controllers/media-assets.controller";
import { authenticate } from "@/middleware/auth";
import { handleMulterError } from "@/middleware/mutler";

const router = Router();
const mediaController = new MediaController();

router.use(authenticate);

router.get("/media/:assetId", mediaController.getAsset.bind(mediaController));
router.get("/media/:projectId/assets", mediaController.getProjectAssets.bind(mediaController));
router.post("/media/:projectId/upload", handleMulterError, mediaController.uploadAsset.bind(mediaController));
router.delete("/media/:assetId", mediaController.deleteAsset.bind(mediaController));

export { router as mediaRoutes };
