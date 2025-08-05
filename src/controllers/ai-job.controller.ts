import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { AIService } from "@/services/ai.service";
import { AuthenticatedRequest } from "@/types/api-response.types";
import { StartAIJobRequest } from "@/types/ai-jobs.types";
import { MediaAssetsService } from "@/services/media-assets.service";

export class AIJobController extends BaseController {
  private aiService = new AIService();

  async startNoiseRemoval(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = this.getUserId(authReq);
      const request: StartAIJobRequest = req.body;

      const job = await this.aiService.startNoiseRemovalJob(userId, request);
      this.success(res, { job });
    } catch (error) {
      console.error("Start noise removal error:", error);
      if (error instanceof Error) {
        this.badRequest(res, error.message);
      } else {
        this.error(res, "Failed to start noise removal job");
      }
    }
  }

  async startSubtitleGeneration(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = this.getUserId(authReq);
      const request: StartAIJobRequest = req.body;

      console.log("Starting subtitle generation job with request:", request);

      const job = await this.aiService.startSubtitleGenerationJob(userId, request);
      this.success(res, { job });
    } catch (error) {
      console.error("Start subtitle generation error:", error);
      if (error instanceof Error) {
        this.badRequest(res, error.message);
      } else {
        this.error(res, "Failed to start subtitle generation job");
      }
    }
  }

  async getJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = this.getUserId(authReq);
      const { jobId } = req.params;

      if (!jobId) {
        this.badRequest(res, "Job ID is required");
        return;
      }

      const job = await this.aiService.getJobStatus(userId, jobId);
      this.success(res, { job });
    } catch (error) {
      console.error("Get job status error:", error);
      if (error instanceof Error) {
        if (error.message === "Job not found") {
          this.notFound(res, "Job not found");
        } else {
          this.badRequest(res, error.message);
        }
      } else {
        this.error(res, "Failed to get job status");
      }
    }
  }

  async getUserJobs(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = this.getUserId(authReq);
      const { projectId, status, type } = req.query;

      const jobs = await this.aiService.getUserJobs(userId, projectId as string, status as string, type as string);

      this.success(res, { jobs });
    } catch (error) {
      console.error("Get user jobs error:", error);
      this.error(res, "Failed to get user jobs");
    }
  }
}
