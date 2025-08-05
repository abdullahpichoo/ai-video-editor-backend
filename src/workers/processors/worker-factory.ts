import { Worker, Job } from "bullmq";
import { workerConfig } from "@/lib/queue";
import { JobService } from "@/services/job.service";
import { MediaAssetsService } from "@/services/media-assets.service";
import { AIJobWorkerData } from "@/types/ai-jobs.types";
import { UploadMediaRequest } from "@/types/media-assets.types";
import { NoiseRemovalProcessor } from "./noise-removal-processor";
import { SubtitleGenerationProcessor } from "./subtitle-processor";

export class WorkerFactory {
  private static setupWorkerEvents(worker: Worker, name: string): void {
    worker.on("ready", () => {
      console.log(`🟢 ${name} worker ready`);
    });

    worker.on("completed", (job: any) => {
      console.log(`✅ ${name} job ${job.id} completed`);
    });

    worker.on("failed", (job: any, err: Error) => {
      console.error(`❌ ${name} job ${job?.id} failed:`, err.message);
    });

    worker.on("error", (err: Error) => {
      console.error(`💥 ${name} worker error:`, err);
    });

    worker.on("stalled", (jobId: string) => {
      console.warn(`⚠️ ${name} job ${jobId} stalled`);
    });
  }

  static createNoiseRemovalWorker(): Worker {
    return new Worker(
      "noise-removal",
      async (job: Job<AIJobWorkerData>) => {
        const { jobId, userId, projectId, assetId, inputData } = job.data;
        const jobService = new JobService();
        const mediaAssetsService = new MediaAssetsService();
        const processor = new NoiseRemovalProcessor(jobService, mediaAssetsService);

        try {
          console.log(`🔊 Starting noise removal job: ${jobId} for asset: ${assetId}`);

          await jobService.updateJobProgress(jobId, 0, "processing");

          const updateProgress = async (progress: number) => {
            await jobService.updateJobProgress(jobId, progress);
            await job.updateProgress(progress);
          };

          const sourceAsset = {
            storagePath: inputData.sourceAssetPath,
            mimeType: inputData.mimeType,
            originalName: inputData.originalAssetName,
          };
          const result = await processor.process(sourceAsset, updateProgress);

          const uploadRequest: UploadMediaRequest = {
            originalName: result.filename,
            mimeType: result.mimeType,
            fileSize: result.fileSize || inputData.fileSize,
            duration: inputData.duration,
            hasAudio: inputData.hasAudio ?? true,
          };

          if (inputData.dimensions) {
            uploadRequest.dimensions = inputData.dimensions;
          }

          const cleanedAsset = await mediaAssetsService.createMediaAsset(userId, projectId, uploadRequest, {
            buffer: result.resultBuffer || Buffer.alloc(0),
            originalname: result.filename,
            mimetype: result.mimeType,
            size: result.fileSize || inputData.fileSize,
          });

          await jobService.completeJob(jobId, {
            resultAssetId: cleanedAsset.assetId,
            resultAssetPath: cleanedAsset.storagePath,
            resultAsset: cleanedAsset,
          });

          console.log(`Noise removal job completed: ${jobId}`);
          return { success: true, resultAssetId: cleanedAsset.assetId };
        } catch (error) {
          console.error(`Noise removal job failed: ${jobId}`, error);
          await jobService.failJob(jobId, error instanceof Error ? error.message : "Unknown error");
          throw error;
        }
      },
      workerConfig
    );
  }

  static createSubtitleGenerationWorker(): Worker {
    return new Worker(
      "subtitle-generation",
      async (job: Job<AIJobWorkerData>) => {
        const { jobId, inputData } = job.data;
        const jobService = new JobService();
        const mediaAssetsService = new MediaAssetsService();
        const processor = new SubtitleGenerationProcessor(jobService, mediaAssetsService);

        try {
          console.log(`📝 Starting subtitle generation job: ${jobId}`);

          await jobService.updateJobProgress(jobId, 0, "processing");

          const updateProgress = async (progress: number) => {
            await jobService.updateJobProgress(jobId, progress);
            await job.updateProgress(progress);
          };

          const sourceAsset = {
            storagePath: inputData.sourceAssetPath,
            mimeType: inputData.mimeType,
            originalName: inputData.originalAssetName,
            duration: inputData.duration || 30,
          };

          const subtitles = await processor.process(sourceAsset, updateProgress);

          await jobService.completeJob(jobId, { subtitles });

          console.log(`Subtitle generation job completed: ${jobId}`);
          return { success: true, subtitles };
        } catch (error) {
          console.error(`Subtitle generation job failed: ${jobId}`, error);
          await jobService.failJob(jobId, error instanceof Error ? error.message : "Unknown error");
          throw error;
        }
      },
      workerConfig
    );
  }

  static createAllWorkers(): Worker[] {
    const workers = [this.createNoiseRemovalWorker(), this.createSubtitleGenerationWorker()];

    workers.forEach((worker) => {
      this.setupWorkerEvents(worker, worker.name);
    });

    return workers;
  }
}
