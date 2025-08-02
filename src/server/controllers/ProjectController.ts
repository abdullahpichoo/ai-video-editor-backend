import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { AuthenticatedRequest } from "@/server/types/ApiResponse";
import {
  ProjectService,
  CreateProjectRequest,
} from "@/server/services/ProjectService";

export class ProjectController extends BaseController {
  private projectService = new ProjectService();

  async createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);

      const body = req.body;

      if (!body.title?.trim()) {
        this.badRequest(res, "Project title is required");
        return;
      }

      if (!body.resolution?.width || !body.resolution?.height) {
        this.badRequest(res, "Project resolution is required");
        return;
      }

      const createData: CreateProjectRequest = {
        title: body.title.trim(),
        description: body.description?.trim(),
        resolution: {
          width: parseInt(body.resolution.width),
          height: parseInt(body.resolution.height),
        },
        ...(body.fps && { fps: parseInt(body.fps) }),
      };

      if (
        isNaN(createData.resolution.width) ||
        isNaN(createData.resolution.height)
      ) {
        this.badRequest(res, "Invalid resolution values");
        return;
      }

      const project = await this.projectService.createProject(
        userId,
        createData
      );

      this.created(res, project);
    } catch (error) {
      console.error("Error creating project:", error);
      this.error(res, "Failed to create project");
    }
  }

  async listProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);

      const page = parseInt((req.query.page as string) || "1");
      const limit = Math.min(parseInt((req.query.limit as string) || "10"), 50);

      if (page < 1 || limit < 1) {
        this.badRequest(res, "Invalid pagination parameters");
        return;
      }

      const result = await this.projectService.getUserProjects(
        userId,
        page,
        limit
      );

      this.success(res, result);
    } catch (error) {
      console.error("Error listing projects:", error);
      this.error(res, "Failed to fetch projects");
    }
  }

  async getProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const projectId = req.params.id;

      if (!projectId) {
        this.badRequest(res, "Project ID is required");
        return;
      }

      const project = await this.projectService.getProjectById(
        projectId,
        userId
      );

      if (!project) {
        this.notFound(res, "Project not found");
        return;
      }

      this.success(res, project);
    } catch (error) {
      console.error("Error fetching project:", error);
      this.error(res, "Failed to fetch project");
    }
  }
}
