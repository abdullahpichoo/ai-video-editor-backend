import { Router } from "express";
import { ProjectController } from "@/controllers/projects.controller";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { createProjectSchema } from "./payload-validation/projects.validation";

const router = Router();
const projectController = new ProjectController();

router.use(authenticate);

router.post("/", validate(createProjectSchema), (req, res) =>
  projectController.createProject(req as any, res)
);
router.get("/", (req, res) => projectController.listProjects(req as any, res));
router.get("/:id", (req, res) => projectController.getProject(req as any, res));

export { router as projectRoutes };
