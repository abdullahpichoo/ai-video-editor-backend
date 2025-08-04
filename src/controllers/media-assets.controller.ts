import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MediaAssetsService, UploadMediaRequest } from "@/services/media-assets.service";
import {
  uploadMediaSchema,
  FILE_SIZE_LIMITS,
  getMaxFileSize,
} from "@/routes/payload-validation/media-assets.validation";
import { AuthenticatedRequest } from "@/types/ApiResponse";
import multer from "multer";
import path from "path";
import { MediaAssetTransformer } from "@/tranformers/media-assets";

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

      console.log("Uploaded file:", req.file);
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
        console.log("Request data for upload:", requestData);

        const validatedData = uploadMediaSchema.parse(requestData);
        metadata = validatedData as UploadMediaRequest;
      } catch (error) {
        console.error("Validation error:", error);
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
      console.error("Upload asset error:", error);

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

  async getUserAssets(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;

      // Parse query parameters for filtering
      const { mimeType, isProcessing, uploadedAfter, uploadedBefore } = req.query;

      const filter: any = {};

      if (mimeType) {
        filter.mimeType = Array.isArray(mimeType) ? mimeType : [mimeType];
      }

      if (isProcessing !== undefined) {
        filter.isProcessing = isProcessing === "true";
      }

      if (uploadedAfter) {
        filter.uploadedAfter = new Date(uploadedAfter as string);
      }

      if (uploadedBefore) {
        filter.uploadedBefore = new Date(uploadedBefore as string);
      }

      const assets = await this.mediaService.getUserMediaAssets(userId, filter);

      this.success(res, {
        assets: assets.map((asset) => ({
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
        })),
        totalCount: assets.length,
      });
    } catch (error) {
      console.error("Get user assets error:", error);
      this.error(res, "Failed to retrieve media assets");
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

  async serveAsset(req: Request, res: Response): Promise<void> {
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

      if (asset.storageType !== "local") {
        this.badRequest(res, "Asset streaming not available for this storage type");
        return;
      }

      const filePath = path.join(process.cwd(), asset.storagePath);

      // Set appropriate headers
      res.setHeader("Content-Type", asset.mimeType);
      res.setHeader("Content-Length", asset.fileSize);

      // For videos, support range requests
      if (asset.mimeType.startsWith("video/")) {
        res.setHeader("Accept-Ranges", "bytes");

        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0] || "0", 10);
          const end = parts[1] ? parseInt(parts[1], 10) : asset.fileSize - 1;
          const chunksize = end - start + 1;

          res.status(206);
          res.setHeader("Content-Range", `bytes ${start}-${end}/${asset.fileSize}`);
          res.setHeader("Content-Length", chunksize);
        }
      }

      res.sendFile(filePath);
    } catch (error) {
      console.error("Serve asset error:", error);
      this.error(res, "Failed to serve media asset");
    }
  }
}
