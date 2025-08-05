import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { AuthenticatedRequest } from "@/types/api-response.types";
import { ProjectsService } from "@/services/projects.service";
import { createProjectSchema } from "@/routes/payload-validation/projects.validation";
import { CreateProjectRequest } from "@/types/project.types";

export class ProjectController extends BaseController {
  private projectService = new ProjectsService();

  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;

      const validationResult = createProjectSchema.safeParse(req.body);
      if (!validationResult.success) {
        this.badRequest(res, "Invalid project data", validationResult.error.issues);
        return;
      }

      const projectData = validationResult.data as CreateProjectRequest;
      const project = await this.projectService.createProject(userId, projectData);

      this.created(res, {
        message: "Project created successfully",
        project,
      });
    } catch (error) {
      console.error("Create project error:", error);
      this.error(res, "Failed to create project");
    }
  }

  async listProjects(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;

      const projects = await this.projectService.getUserProjects(userId);
      this.success(res, { projects });
    } catch (error) {
      console.error("List projects error:", error);
      this.error(res, "Failed to fetch projects");
    }
  }

  async getProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        this.badRequest(res, "Project ID is required");
        return;
      }

      const project = await this.projectService.getProject(projectId);

      if (!project) {
        this.notFound(res, "Project not found");
        return;
      }

      this.success(res, project);
    } catch (error) {
      console.error("Get project error:", error);
      this.error(res, "Failed to fetch project");
    }
  }

  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        this.badRequest(res, "Project ID is required");
        return;
      }

      await this.projectService.deleteProject(projectId);

      this.success(res, {
        message: "Project deleted successfully",
      });
    } catch (error) {
      console.error("Delete project error:", error);

      const isProjectNotFound = error instanceof Error && error.message.includes("not found");
      if (isProjectNotFound) {
        this.notFound(res, error.message);
        return;
      }

      this.error(res, "Failed to delete project");
    }
  }
}
