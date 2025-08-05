export interface CreateMediaAssetInput {
  userId: string;
  originalName: string;
  filename: string;
  fileSize: number;
  mimeType: SupportedMimeType;
  storageType: "vercel-blob";
  storagePath?: string;

  duration?: number;
  dimensions?: { width: number; height: number };
  fps?: number;
  hasAudio?: boolean;
  thumbnailDataUrl?: string;
}

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

export type SupportedMimeType =
  | "video/mp4"
  | "video/webm"
  | "image/png"
  | "image/jpeg"
  | "audio/mpeg"
  | "audio/wav"
  | "audio/aac"
  | "audio/mp3";

export interface MediaAssetFilter {
  userId: string;
  mimeType?: SupportedMimeType[];
  isProcessing?: boolean;
  uploadedAfter?: Date;
  uploadedBefore?: Date;
}
