import { Router } from "express";
import { MediaController, upload } from "@/controllers/media-assets.controller";
import { authenticate } from "@/middleware/auth";
import { Request, Response, NextFunction } from "express";
import { handleMulterError } from "@/middleware/mutler";

const router = Router();
const mediaController = new MediaController();

router.use(authenticate);

router.post(
  "/:projectId/upload",
  handleMulterError,
  mediaController.uploadAsset.bind(mediaController)
);

router.get("/:assetId", mediaController.getAsset.bind(mediaController));

router.get("/", mediaController.getUserAssets.bind(mediaController));

router.get(
  "/:projectId/assets",
  mediaController.getProjectAssets.bind(mediaController)
);

router.delete("/:assetId", mediaController.deleteAsset.bind(mediaController));

router.get("/:assetId/file", mediaController.serveAsset.bind(mediaController));

export { router as mediaRoutes };
