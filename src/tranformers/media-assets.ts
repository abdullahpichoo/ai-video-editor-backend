import { MediaAsset } from "@/models";

export interface MediaAssetResponse {
  assetId: string;
  originalName: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  type: "video" | "image" | "audio";
  storagePath: string;
  duration: number;
  dimensions: {
    width: number;
    height: number;
  } | null;
}

export class MediaAssetTransformer {
  static transformMany(assets: MediaAsset[]): MediaAssetResponse[] {
    return assets.map((asset) => this.transform(asset));
  }

  static transformGroupByType(assets: MediaAsset[]) {
    return assets.reduce((acc, asset) => {
      const type = asset.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(this.transform(asset));
      return acc;
    }, {} as Record<string, MediaAssetResponse[]>);
  }

  static transform(asset: MediaAsset): MediaAssetResponse {
    return {
      assetId: asset.assetId,
      originalName: asset.originalName,
      filename: asset.filename,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType,
      uploadedAt: asset.uploadedAt.toISOString(),
      type: asset.type,
      storagePath: asset.storagePath,
      duration: asset.duration || 0,
      dimensions: asset.dimensions || null,
    };
  }
}
