import type { RequestHandler } from "express";

const healthCheck: RequestHandler = (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "TaskForge API is running",
  });
};

export { healthCheck };
