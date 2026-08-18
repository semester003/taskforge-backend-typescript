import type { Prisma } from "@prisma/client";
import type { RequestHandler } from "express";
import prisma from "../config/prisma.js";
import type { RouteParams } from "../types/domain.js";

type ProjectParams = RouteParams<"projectId">;
type TaskParams = RouteParams<"taskId">;

interface CreateTaskRequestBody {
  title: string;
}

interface UpdateTaskRequestBody {
  title?: string;
  completed?: boolean;
}

interface AssignTaskRequestBody {
  userId: number;
}

const assigneeSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

const createTask: RequestHandler<ProjectParams, unknown, CreateTaskRequestBody> = async (
  req,
  res,
) => {
  const projectId = Number(req.params.projectId);
  const { title } = req.body;

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

  const task = await prisma.task.create({
    data: {
      title,
      projectId,
    },
    include: {
      assignee: {
        select: assigneeSelect,
      },
    },
  });

  return res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: task,
  });
};

const getTasks: RequestHandler<ProjectParams> = async (req, res) => {
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

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      assignee: {
        select: assigneeSelect,
      },
    },
  });

  return res.status(200).json({
    success: true,
    data: tasks,
  });
};

const getTaskById: RequestHandler<TaskParams> = async (req, res) => {
  const taskId = Number(req.params.taskId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId: req.user.userId,
            },
          },
        },
      },
    },
    include: {
      assignee: {
        select: assigneeSelect,
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: task,
  });
};

const updateTask: RequestHandler<TaskParams, unknown, UpdateTaskRequestBody> = async (req, res) => {
  const taskId = Number(req.params.taskId);
  const { title, completed } = req.body;

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId: req.user.userId,
            },
          },
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      title,
      completed,
    },
    include: {
      assignee: {
        select: assigneeSelect,
      },
    },
  });

  return res.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: updatedTask,
  });
};

const deleteTask: RequestHandler<TaskParams> = async (req, res) => {
  const taskId = Number(req.params.taskId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId: req.user.userId,
            },
          },
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
};

const assignTask: RequestHandler<TaskParams, unknown, AssignTaskRequestBody> = async (req, res) => {
  const taskId = Number(req.params.taskId);
  const { userId } = req.body;

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId: req.user.userId,
            },
          },
        },
      },
    },
    include: {
      project: {
        select: {
          workspaceId: true,
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: task.project.workspaceId,
      userId,
    },
  });

  if (!member) {
    return res.status(400).json({
      success: false,
      message: "User is not a member of this workspace",
    });
  }

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      assigneeId: userId,
    },
    include: {
      assignee: {
        select: assigneeSelect,
      },
    },
  });

  return res.status(200).json({
    success: true,
    message: "Task assigned successfully",
    data: updatedTask,
  });
};

const unassignTask: RequestHandler<TaskParams> = async (req, res) => {
  const taskId = Number(req.params.taskId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId: req.user.userId,
            },
          },
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      assigneeId: null,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Task unassigned successfully",
    data: updatedTask,
  });
};

export {
  assignTask,
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  unassignTask,
  updateTask,
};
