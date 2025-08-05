import { JobService } from "./job.service";
import { MediaAssetsService } from "./media-assets.service";
import { StartAIJobRequest, JobStatusResponse, UserJobsResponse } from "@/types/ai-jobs.types";

export class AIService {
  private mediaAssetsService = new MediaAssetsService();
  private jobService = new JobService();

  async startNoiseRemovalJob(userId: string, request: StartAIJobRequest): Promise<JobStatusResponse> {
    if (!request.assetId || !request.projectId) {
      throw new Error("Asset ID and Project ID are required");
    }

    const sourceAsset = await this.mediaAssetsService.getMediaAsset(request.assetId, userId);
    if (!sourceAsset) {
      throw new Error("Source asset not found");
    }

    // Validate that the asset is suitable for noise removal
    if (sourceAsset.type !== "video" && sourceAsset.type !== "audio") {
      throw new Error("Noise removal is only available for video and audio files");
    }

    if (!sourceAsset.hasAudio) {
      throw new Error("Cannot remove noise from assets without audio");
    }

    const jobInputData: any = {
      sourceAssetPath: sourceAsset.storagePath,
      originalAssetName: sourceAsset.originalName,
      mimeType: sourceAsset.mimeType,
      fileSize: sourceAsset.fileSize,
      duration: sourceAsset.duration || 10,
      hasAudio: sourceAsset.hasAudio,
    };

    if (sourceAsset.dimensions) {
      jobInputData.dimensions = sourceAsset.dimensions;
    }

    const job = await this.jobService.createJob(
      "noise-removal",
      userId,
      request.projectId,
      request.assetId,
      jobInputData
    );

    return {
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      progress: job.progress,
      ...(job.estimatedDuration && { estimatedDuration: job.estimatedDuration }),
      createdAt: job.createdAt,
    };
  }

  async startSubtitleGenerationJob(userId: string, request: StartAIJobRequest): Promise<JobStatusResponse> {
    if (!request.assetId || !request.projectId) {
      throw new Error("Asset ID and Project ID are required");
    }

    // Get the source media asset to validate it exists and get its properties
    const sourceAsset = await this.mediaAssetsService.getMediaAsset(request.assetId, userId);
    if (!sourceAsset) {
      throw new Error("Source asset not found");
    }

    // Validate that the asset is suitable for subtitle generation
    if (sourceAsset.type !== "video" && sourceAsset.type !== "audio") {
      throw new Error("Subtitle generation is only available for video and audio files");
    }

    const subtitleJobInputData: any = {
      sourceAssetPath: sourceAsset.storagePath,
      originalAssetName: sourceAsset.originalName,
      mimeType: sourceAsset.mimeType,
      fileSize: sourceAsset.fileSize,
      duration: sourceAsset.duration || 10,
      hasAudio: sourceAsset.hasAudio,
    };

    // Add optional properties only if they exist
    if (sourceAsset.dimensions) {
      subtitleJobInputData.dimensions = sourceAsset.dimensions;
    }
    if (sourceAsset.fps) {
      subtitleJobInputData.fps = sourceAsset.fps;
    }

    const job = await this.jobService.createJob(
      "subtitle-generation",
      userId,
      request.projectId,
      request.assetId,
      subtitleJobInputData
    );

    return {
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      progress: job.progress,
      ...(job.estimatedDuration && { estimatedDuration: job.estimatedDuration }),
      createdAt: job.createdAt,
    };
  }

  async getJobStatus(userId: string, jobId: string): Promise<JobStatusResponse> {
    if (!jobId) {
      throw new Error("Job ID is required");
    }

    const job = await this.jobService.getJob(jobId, userId);

    if (!job) {
      throw new Error("Job not found");
    }

    return {
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      progress: job.progress,
      ...(job.estimatedDuration && { estimatedDuration: job.estimatedDuration }),
      ...(job.outputData && { outputData: job.outputData }),
      ...(job.errorMessage && { errorMessage: job.errorMessage }),
      createdAt: job.createdAt,
      ...(job.startedAt && { startedAt: job.startedAt }),
      ...(job.completedAt && { completedAt: job.completedAt }),
    };
  }

  async getUserJobs(userId: string, projectId?: string, status?: string, type?: string): Promise<UserJobsResponse[]> {
    const jobs = await this.jobService.getUserJobs(userId, projectId, status, type);

    return jobs.map((job) => ({
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      progress: job.progress,
      projectId: job.projectId,
      assetId: job.assetId,
      ...(job.estimatedDuration && { estimatedDuration: job.estimatedDuration }),
      ...(job.outputData && { outputData: job.outputData }),
      ...(job.errorMessage && { errorMessage: job.errorMessage }),
      createdAt: job.createdAt,
      ...(job.completedAt && { completedAt: job.completedAt }),
    }));
  }
}
