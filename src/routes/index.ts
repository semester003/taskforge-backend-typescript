import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.js";
import authRoutes from "./auth.routes.js";
import projectRoutes from "./project.routes.js";
import taskRoutes from "./task.routes.js";
import workspaceRoutes from "./workspace.routes.js";

const router = Router();

router.get("/health", healthCheck);
router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/", projectRoutes);
router.use("/", taskRoutes);

export default router;
