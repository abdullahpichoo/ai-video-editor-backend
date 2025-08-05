import { VideoProject } from "@/models";

export interface CreateProjectRequest {
  title: string;
  description?: string;
  resolution: {
    width: number;
    height: number;
  };
  fps?: number;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  resolution?: {
    width: number;
    height: number;
  };
  fps?: number;
}

export interface ProjectsListResponse {
  projects: VideoProject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
