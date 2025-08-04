import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { TimelineService, UpdateTimelineRequest } from "@/services/timeline.service";
import { updateTimelineSchema } from "@/routes/payload-validation/timeline.validation";
import { AuthenticatedRequest } from "@/types/ApiResponse";

export class TimelineController extends BaseController {
  private timelineService: TimelineService;

  constructor() {
    super();
    this.timelineService = new TimelineService();
  }

  async getTimeline(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      const { projectId } = req.params;

      if (!projectId) {
        this.badRequest(res, "Project ID is required");
        return;
      }

      const timeline = await this.timelineService.getTimeline(projectId, userId);

      if (!timeline) {
        this.notFound(res, "Timeline not found");
        return;
      }

      this.success(res, timeline);
    } catch (error) {
      console.error("Get timeline error:", error);
      this.error(res, "Failed to get timeline");
    }
  }

  async updateTimeline(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      const { projectId } = req.params;

      if (!projectId) {
        this.badRequest(res, "Project ID is required");
        return;
      }

      const validationResult = updateTimelineSchema.safeParse(req.body);
      if (!validationResult.success) {
        this.badRequest(res, "Invalid timeline data", validationResult.error.issues);
        return;
      }

      const timelineData = validationResult.data as UpdateTimelineRequest;
      const timeline = await this.timelineService.updateTimeline(projectId, userId, timelineData);

      this.success(res, {
        message: "Timeline updated successfully",
        timeline,
      });
    } catch (error) {
      console.error("Update timeline error:", error);
      this.error(res, "Failed to update timeline");
    }
  }
}
