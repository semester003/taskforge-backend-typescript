import type { RequestHandler } from "express";
import prisma from "../config/prisma.js";
import type { RouteParams } from "../types/domain.js";

type WorkspaceParams = RouteParams<"workspaceId">;
type ProjectParams = RouteParams<"projectId">;

interface ProjectRequestBody {
  name: string;
  description?: string | null;
}

const createProject: RequestHandler<WorkspaceParams, unknown, ProjectRequestBody> = async (
  req,
  res,
) => {
  const workspaceId = Number(req.params.workspaceId);
  const { name, description } = req.body;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: req.user.userId,
    },
  });

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: "You are not a member of this workspace",
    });
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      workspaceId,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project,
  });
};

const getProjects: RequestHandler<WorkspaceParams> = async (req, res) => {
  const workspaceId = Number(req.params.workspaceId);

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: req.user.userId,
    },
  });

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: "You are not a member of this workspace",
    });
  }

  const projects = await prisma.project.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json({
    success: true,
    data: projects,
  });
};

const updateProject: RequestHandler<ProjectParams, unknown, ProjectRequestBody> = async (req, res) => {
  const projectId = Number(req.params.projectId);
  const { name, description } = req.body;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: {
            userId: req.user.userId,
          },
        },
      },
    },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  const updatedProject = await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      name,
      description,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Project updated successfully",
    data: updatedProject,
  });
};

const deleteProject: RequestHandler<ProjectParams> = async (req, res) => {
  const projectId = Number(req.params.projectId);

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: {
            userId: req.user.userId,
          },
        },
      },
    },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
};

export { createProject, deleteProject, getProjects, updateProject };
