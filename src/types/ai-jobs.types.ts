import { JobType } from "@/models/ai-job.model";

export interface StartAIJobRequest {
  assetId: string;
  projectId: string;
}

export interface JobStatusResponse {
  jobId: string;
  type: JobType;
  status: string;
  progress: number;
  estimatedDuration?: number;
  outputData?: JobOutputData;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface UserJobsResponse {
  jobId: string;
  type: JobType;
  status: string;
  progress: number;
  projectId: string;
  assetId: string;
  estimatedDuration?: number;
  outputData?: JobOutputData;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface JobOutputData {
  resultAssetId?: string;
  resultAssetPath?: string;
  subtitles?: SubtitleSegment[];
}

export interface SubtitleSegment {
  startTime: number;
  endTime: number;
  text: string;
}

export interface AIJobWorkerData {
  jobId: string;
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
}

export interface NoiseRemovalResult {
  cleanedAudioPath: string;
  resultAssetId: string;
}

export interface SubtitleGenerationResult {
  subtitles: SubtitleSegment[];
}
