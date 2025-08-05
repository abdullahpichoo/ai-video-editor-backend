import { ObjectId } from "mongodb";
import { MediaAsset } from "./media-asset.model";

export type JobType = "noise-removal" | "subtitle-generation";
export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface AIJob {
  _id?: ObjectId;
  jobId: string;
  type: JobType;
  status: JobStatus;
  userId: string;
  projectId: string;
  assetId: string;

  inputData: {
    sourceAssetPath: string;
    originalAssetName: string;
    mimeType: string;
    fileSize: number;
    duration: number;
    dimensions?: { width: number; height: number };
    fps?: number;
    hasAudio?: boolean;
  };

  outputData?: {
    resultAssetId?: string;
    resultAssetPath?: string;
    resultAsset?: MediaAsset;
    subtitles?: Array<{
      startTime: number;
      endTime: number;
      text: string;
    }>;
  };

  progress: number;
  errorMessage?: string;
  estimatedDuration?: number;

  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}
