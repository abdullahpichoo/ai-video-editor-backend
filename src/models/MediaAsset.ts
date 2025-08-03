import { ObjectId } from "mongodb";

export interface MediaAsset {
  _id?: ObjectId;
  assetId: string; // UUID for this asset

  userId: string;
  projectId: string;

  // File information
  originalName: string;
  filename: string; // Stored filename
  fileSize: number; // in bytes
  type: "video" | "image" | "audio";
  mimeType: string; // video/mp4, video/webm, image/png, image/jpeg

  // Storage information
  storageType: "local" | "vercel-blob"; // local uploads for dev, Vercel blob for production
  storagePath: string; // file path or blob URL
  thumbnailPath?: string; // path to thumbnail image

  // Media metadata
  duration?: number; // for videos, in seconds
  dimensions?: {
    width: number;
    height: number;
  };
  fps?: number; // for videos
  hasAudio?: boolean; // for videos

  // Processing status
  isProcessing: boolean;
  processingError?: string;

  // Timestamps
  uploadedAt: Date;
  updatedAt: Date;
}
