import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "../controllers/project.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = Router();

router.post("/workspaces/:workspaceId/projects", authenticate, createProject);
router.get("/workspaces/:workspaceId/projects", authenticate, getProjects);
router.put("/projects/:projectId", authenticate, updateProject);
router.delete("/projects/:projectId", authenticate, deleteProject);

export default router;
