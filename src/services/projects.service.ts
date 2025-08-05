import { MediaAssetsService } from "@/services/media-assets.service";
import { VideoProject } from "@/models/video-project.model";
import { getVideoProjectsCollection } from "@/lib/database";
import { ObjectId } from "mongodb";
import { TimelineService } from "./timeline.service";
import { CreateProjectRequest } from "@/types/project.types";

const PROJECT_NOT_FOUND = "Project not found";

export class ProjectsService {
  async createProject(userId: string, data: CreateProjectRequest): Promise<VideoProject> {
    const collection = await getVideoProjectsCollection();

    const project: VideoProject = {
      _id: new ObjectId(),
      userId,
      title: data.title,
      ...(data.description && { description: data.description }),
      resolution: data.resolution,
      ...(data.fps && { fps: data.fps }),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastOpenedAt: new Date(),
    };

    await collection.insertOne(project as VideoProject);
    return project;
  }

  async getUserProjects(userId: string): Promise<VideoProject[]> {
    const collection = await getVideoProjectsCollection();

    return await collection.find({ userId }).sort({ updatedAt: -1 }).toArray();
  }

  async getProject(projectId: string): Promise<VideoProject | null> {
    const collection = await getVideoProjectsCollection();

    const project = await collection.findOne({
      _id: new ObjectId(projectId),
    });

    return project;
  }

  async deleteProject(projectId: string): Promise<void> {
    const collection = await getVideoProjectsCollection();

    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(PROJECT_NOT_FOUND);
    }

    if (!project._id) {
      throw new Error("Invalid project ID");
    }

    await this.deleteProjectAssets(projectId);
    await this.deleteProjectTimeline(projectId);

    await collection.deleteOne({ _id: project._id });
  }

  private async deleteProjectAssets(projectId: string): Promise<void> {
    try {
      const mediaAssetsService = new MediaAssetsService();
      await mediaAssetsService.deleteProjectAssets(projectId);
    } catch (error) {
      console.error("Error deleting project assets:", error);
    }
  }

  private async deleteProjectTimeline(projectId: string): Promise<void> {
    try {
      const timelineService = new TimelineService();
      await timelineService.deleteTimeline(projectId);
    } catch (error) {
      console.error("Error deleting project timeline:", error);
    }
  }
}
