import { getMediaAssetsCollection } from "@/lib/database";
import { promises as fs } from "fs";
import path from "path";
import { config } from "@/config";
import { del, put } from "@vercel/blob";
import { MediaAsset } from "@/models";
import { UploadMediaRequest } from "@/types/media-assets";

export class MediaAssetsService {
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
    const collection = await getMediaAssetsCollection();
    const assetId = crypto.randomUUID();
    const filename = this.generateUniqueFilename(uploadData.originalName);

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

  async deleteProjectAssets(projectId: string): Promise<void> {
    const collection = await getMediaAssetsCollection();
    const assets = await collection.find({ projectId }).toArray();
    const deletePromises = assets.map((asset) => this.deleteMediaAsset(asset.assetId, asset.userId));
    await Promise.allSettled(deletePromises);
    await collection.deleteMany({ projectId });
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

  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);

    return `${baseName}-${timestamp}-${randomString}${extension}`;
  }
}
