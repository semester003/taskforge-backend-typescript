import { Router } from "express";
import {
  assignTask,
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  unassignTask,
  updateTask,
} from "../controllers/task.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = Router();

router.post("/projects/:projectId/tasks", authenticate, createTask);
router.get("/projects/:projectId/tasks", authenticate, getTasks);
router.get("/tasks/:taskId", authenticate, getTaskById);
router.put("/tasks/:taskId", authenticate, updateTask);
router.delete("/tasks/:taskId", authenticate, deleteTask);
router.patch("/tasks/:taskId/assign", authenticate, assignTask);
router.patch("/tasks/:taskId/unassign", authenticate, unassignTask);

export default router;
