import { Router } from "express";
import { ProjectController } from "@/controllers/projects.controller";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { createProjectSchema } from "./payload-validation/projects.validation";

const router = Router();
const projectController = new ProjectController();

router.use(authenticate);

router.post("/projects", validate(createProjectSchema), projectController.createProject.bind(projectController));
router.get("/projects", projectController.listProjects.bind(projectController));
router.get("/projects/:projectId", projectController.getProject.bind(projectController));
router.delete("/projects/:projectId", projectController.deleteProject.bind(projectController));

export { router as projectRoutes };
