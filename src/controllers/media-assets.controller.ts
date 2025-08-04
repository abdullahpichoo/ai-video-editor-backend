import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MediaAssetsService } from "@/services/media-assets.service";
import {
  uploadMediaSchema,
  FILE_SIZE_LIMITS,
  getMaxFileSize,
} from "@/routes/payload-validation/media-assets.validation";
import { AuthenticatedRequest } from "@/types/api-response";
import multer from "multer";
import path from "path";
import { MediaAssetTransformer } from "@/tranformers/media-assets";
import { UploadMediaRequest } from "@/types/media-assets";

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimeTypes = [
    "video/mp4",
    "video/webm",
    "image/png",
    "image/jpeg",
    "audio/mpeg",
    "audio/wav",
    "audio/aac",
    "audio/mp3",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    const maxSize = getMaxFileSize(file.mimetype);
    if (file.size && file.size > maxSize) {
      const fileType = file.mimetype.split("/")[0];
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      cb(new Error(`${fileType} file size cannot exceed ${maxSizeMB}MB`), false);
      return;
    }
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.video, // Use the largest limit (video) for multer
  },
});

export class MediaController extends BaseController {
  private mediaService = new MediaAssetsService();

  async uploadAsset(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      const { projectId } = req.params;
      if (!projectId) {
        this.badRequest(res, "Project ID is required");
        return;
      }

      if (!req.file) {
        this.badRequest(res, "No file uploaded");
        return;
      }

      let metadata: UploadMediaRequest;
      try {
        const requestData: UploadMediaRequest = {
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          originalName: req.file.originalname,
          duration: req.body.duration && parseFloat(req.body.duration),
          dimensions: req.body.dimensions && JSON.parse(req.body.dimensions),
          fps: req.body.fps && parseFloat(req.body.fps),
          hasAudio: req.body.hasAudio && JSON.parse(req.body.hasAudio),
        };

        const validatedData = uploadMediaSchema.parse(requestData);
        metadata = validatedData as UploadMediaRequest;
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "ZodError") {
            const zodError = error as any;
            const firstError = zodError.issues[0];
            this.badRequest(res, firstError?.message || "Validation failed");
            return;
          }
        }
        this.badRequest(res, "Invalid metadata format or validation failed");
        return;
      }

      const mediaAsset = await this.mediaService.createMediaAsset(userId, projectId, metadata, {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      this.created(res, {
        message: "Media asset uploaded successfully",
        asset: MediaAssetTransformer.transform(mediaAsset),
      });
    } catch (error) {
      if (error instanceof Error) {
        // Handle multer errors
        if (error.message.includes("file size")) {
          this.badRequest(res, error.message);
          return;
        }
        if (error.message.includes("Unsupported file type")) {
          this.badRequest(
            res,
            "Unsupported file type. Supported formats: MP4, WebM (video), PNG, JPEG (image), MP3, WAV, AAC, MPEG (audio)"
          );
          return;
        }
        if (error.message.includes("storage")) {
          this.error(res, "Storage error occurred");
          return;
        }
        if (error.message.includes("metadata")) {
          this.badRequest(res, error.message);
          return;
        }
      }

      this.error(res, "Failed to upload media asset");
    }
  }

  async getAsset(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      const { assetId } = req.params;

      if (!assetId) {
        this.badRequest(res, "Asset ID is required");
        return;
      }

      const asset = await this.mediaService.getMediaAsset(assetId, userId);

      if (!asset) {
        this.notFound(res, "Media asset not found");
        return;
      }

      this.success(res, {
        asset: {
          id: asset.assetId,
          originalName: asset.originalName,
          filename: asset.filename,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
          duration: asset.duration,
          dimensions: asset.dimensions,
          fps: asset.fps,
          hasAudio: asset.hasAudio,
          thumbnailPath: asset.thumbnailPath,
          isProcessing: asset.isProcessing,
          processingError: asset.processingError,
          uploadedAt: asset.uploadedAt,
          updatedAt: asset.updatedAt,
        },
      });
    } catch (error) {
      console.error("Get asset error:", error);
      this.error(res, "Failed to retrieve media asset");
    }
  }

  async getProjectAssets(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        this.badRequest(res, "Project ID is required");
        return;
      }

      const assets = await this.mediaService.getProjectAllMediaAssets(projectId);

      this.success(res, {
        assets: MediaAssetTransformer.transformMany(assets),
        totalCount: assets.length,
      });
    } catch (error) {
      console.error("Get project assets error:", error);
      this.error(res, "Failed to retrieve media assets for project");
    }
  }

  async deleteAsset(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      const { assetId } = req.params;

      if (!assetId) {
        this.badRequest(res, "Asset ID is required");
        return;
      }

      const deleted = await this.mediaService.deleteMediaAsset(assetId, userId);

      if (!deleted) {
        this.notFound(res, "Media asset not found");
        return;
      }

      this.success(res, {
        message: "Media asset deleted successfully",
      });
    } catch (error) {
      console.error("Delete asset error:", error);
      this.error(res, "Failed to delete media asset");
    }
  }
}
