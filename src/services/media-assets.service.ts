import { MediaAsset, CreateMediaAssetInput, MediaAssetFilter } from "@/models";
import { getMediaAssetsCollection } from "@/lib/database";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/config";
import { del, put } from "@vercel/blob";

export interface UploadMediaRequest {
  originalName: string;
  mimeType: string;
  fileSize: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  fps?: number;
  hasAudio?: boolean;
  thumbnailDataUrl?: string;
}

export class MediaAssetsService {
  private getStorageConfig() {
    return {
      isProduction: config.nodeEnv === "production",
      uploadsDir: path.join(process.cwd(), "uploads"),
      thumbnailsDir: path.join(process.cwd(), "uploads", "thumbnails"),
    };
  }

  private getAssetType(mimeType: string): "video" | "image" | "audio" {
    if (mimeType.startsWith("video/")) {
      return "video";
    } else if (mimeType.startsWith("image/")) {
      return "image";
    } else if (mimeType.startsWith("audio/")) {
      return "audio";
    } else {
      return "image";
    }
  }

  private async ensureDirectoriesExist(): Promise<void> {
    const { uploadsDir, thumbnailsDir } = this.getStorageConfig();

    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(thumbnailsDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create upload directories:", error);
      throw new Error("Failed to initialize storage directories");
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);

    return `${baseName}-${timestamp}-${randomString}${extension}`;
  }

  private async saveThumbnail(thumbnailDataUrl: string, assetId: string): Promise<string> {
    const { thumbnailsDir } = this.getStorageConfig();

    const matches = thumbnailDataUrl.match(/^data:image\/([a-z]+);base64,(.+)$/);
    if (!matches || !matches[2]) {
      throw new Error("Invalid thumbnail data URL format");
    }

    const [, extension, base64Data] = matches;
    const thumbnailFilename = `${assetId}-thumbnail.${extension}`;
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

    const buffer = Buffer.from(base64Data, "base64");
    await fs.writeFile(thumbnailPath, buffer);

    return path.join("thumbnails", thumbnailFilename);
  }

  async createMediaAsset(
    userId: string,
    projectId: string,
    uploadData: UploadMediaRequest,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    }
  ): Promise<MediaAsset> {
    await this.ensureDirectoriesExist();

    const collection = await getMediaAssetsCollection();
    const assetId = crypto.randomUUID();
    const filename = this.generateUniqueFilename(uploadData.originalName);
    const { uploadsDir, isProduction } = this.getStorageConfig();

    let storagePath: string;
    let thumbnailPath: string | undefined;

    try {
      const { url } = await put(`uploads/${filename}`, file.buffer, {
        access: "public",
        addRandomSuffix: true,
      });
      storagePath = url;
    } catch (error) {
      console.error("Failed to upload file to Vercel Blob:", error);
      throw new Error("Failed to upload file to storage");
    }

    // Save thumbnail if provided
    if (uploadData.thumbnailDataUrl) {
      thumbnailPath = await this.saveThumbnail(uploadData.thumbnailDataUrl, assetId);
    }

    const mediaAsset: Omit<MediaAsset, "_id"> = {
      userId,
      assetId,
      projectId,
      originalName: uploadData.originalName,
      filename,
      fileSize: uploadData.fileSize,
      mimeType: uploadData.mimeType as any,
      type: this.getAssetType(uploadData.mimeType),
      storageType: "vercel-blob",
      storagePath,
      ...(thumbnailPath && { thumbnailPath }),
      ...(uploadData.duration && { duration: uploadData.duration }),
      ...(uploadData.dimensions && { dimensions: uploadData.dimensions }),
      ...(uploadData.fps && { fps: uploadData.fps }),
      hasAudio: !!uploadData.hasAudio,
      isProcessing: false,
      uploadedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(mediaAsset as MediaAsset);

    return {
      ...mediaAsset,
      _id: result.insertedId,
    } as MediaAsset;
  }

  async getMediaAsset(assetId: string, userId: string): Promise<MediaAsset | null> {
    const collection = await getMediaAssetsCollection();
    return await collection.findOne({ assetId, userId });
  }

  async getProjectAllMediaAssets(projectId: string): Promise<MediaAsset[]> {
    const collection = await getMediaAssetsCollection();

    return await collection.find({ projectId }).sort({ uploadedAt: -1 }).toArray();
  }

  async getUserMediaAssets(userId: string, filter?: Partial<MediaAssetFilter>): Promise<MediaAsset[]> {
    const collection = await getMediaAssetsCollection();

    const query: any = { userId };

    if (filter?.mimeType && filter.mimeType.length > 0) {
      query.mimeType = { $in: filter.mimeType };
    }

    if (filter?.isProcessing !== undefined) {
      query.isProcessing = filter.isProcessing;
    }

    if (filter?.uploadedAfter) {
      query.uploadedAt = { ...query.uploadedAt, $gte: filter.uploadedAfter };
    }

    if (filter?.uploadedBefore) {
      query.uploadedAt = { ...query.uploadedAt, $lte: filter.uploadedBefore };
    }

    return await collection.find(query).sort({ uploadedAt: -1 }).toArray();
  }

  async deleteMediaAsset(assetId: string, userId: string): Promise<boolean> {
    const collection = await getMediaAssetsCollection();
    const asset = await collection.findOne({ assetId, userId });

    if (!asset) {
      return false;
    }

    try {
      await del(`uploads/${asset.filename}`);
    } catch (error) {
      console.error("Failed to delete asset files:", error);
    }

    const result = await collection.deleteOne({ assetId, userId });
    return result.deletedCount > 0;
  }

  async updateAssetProcessingStatus(
    assetId: string,
    userId: string,
    isProcessing: boolean,
    processingError?: string
  ): Promise<boolean> {
    const collection = await getMediaAssetsCollection();

    const updateData: any = {
      isProcessing,
      updatedAt: new Date(),
    };

    if (processingError !== undefined) {
      updateData.processingError = processingError;
    }

    const result = await collection.updateOne({ assetId, userId }, { $set: updateData });

    return result.modifiedCount > 0;
  }
}
