import type { RequestHandler } from "express";
import prisma from "../config/prisma.js";
import {
  isEditableWorkspaceRole,
  type RouteParams,
  type WorkspaceRole,
} from "../types/domain.js";

type WorkspaceParams = RouteParams<"id">;
type WorkspaceMemberParams = WorkspaceParams & RouteParams<"userId">;

interface WorkspaceRequestBody {
  name: string;
}

interface InvitationRequestBody {
  email: string;
}

interface UpdateMemberRoleRequestBody {
  role?: WorkspaceRole;
}

const createWorkspace: RequestHandler<Record<string, never>, unknown, WorkspaceRequestBody> = async (
  req,
  res,
) => {
  const { name } = req.body;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      ownerId: req.user.userId,
      members: {
        create: {
          userId: req.user.userId,
          role: "OWNER",
        },
      },
    },
  });

  return res.status(201).json({
    success: true,
    message: "Workspace created successfully",
    data: workspace,
  });
};

const getMyWorkspaces: RequestHandler = async (req, res) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId: req.user.userId,
    },
    include: {
      workspace: true,
    },
  });

  return res.status(200).json({
    success: true,
    data: memberships,
  });
};

const updateWorkspace: RequestHandler<WorkspaceParams, unknown, WorkspaceRequestBody> = async (
  req,
  res,
) => {
  const workspaceId = Number(req.params.id);
  const { name } = req.body;

  const workspace = await prisma.workspace.updateMany({
    where: {
      id: workspaceId,
      ownerId: req.user.userId,
    },
    data: {
      name,
    },
  });

  if (workspace.count === 0) {
    return res.status(404).json({
      success: false,
      message: "Workspace not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Workspace updated successfully",
  });
};

const deleteWorkspace: RequestHandler<WorkspaceParams> = async (req, res) => {
  const workspaceId = Number(req.params.id);

  const workspace = await prisma.workspace.deleteMany({
    where: {
      id: workspaceId,
      ownerId: req.user.userId,
    },
  });

  if (workspace.count === 0) {
    return res.status(404).json({
      success: false,
      message: "Workspace not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Workspace deleted successfully",
  });
};

const createInvitation: RequestHandler<WorkspaceParams, unknown, InvitationRequestBody> = async (
  req,
  res,
) => {
  const workspaceId = Number(req.params.id);
  const { email } = req.body;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: req.user.userId,
      role: {
        in: ["OWNER", "ADMIN"] satisfies WorkspaceRole[],
      },
    },
  });

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: "Only workspace owner or admin can invite members",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const invitation = await prisma.workspaceInvitation.create({
    data: {
      workspaceId,
      invitedUserId: user.id,
      invitedById: req.user.userId,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Invitation sent successfully",
    data: invitation,
  });
};

const getMyInvitations: RequestHandler = async (req, res) => {
  const invitations = await prisma.workspaceInvitation.findMany({
    where: {
      invitedUserId: req.user.userId,
      status: "PENDING",
    },
    include: {
      workspace: true,
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return res.status(200).json({
    success: true,
    data: invitations,
  });
};

const acceptInvitation: RequestHandler<WorkspaceParams> = async (req, res) => {
  const invitationId = Number(req.params.id);

  const invitation = await prisma.workspaceInvitation.findFirst({
    where: {
      id: invitationId,
      invitedUserId: req.user.userId,
      status: "PENDING",
    },
  });

  if (!invitation) {
    return res.status(404).json({
      success: false,
      message: "Invitation not found",
    });
  }

  const membership = await prisma.workspaceMember.create({
    data: {
      userId: req.user.userId,
      workspaceId: invitation.workspaceId,
      role: "MEMBER",
    },
  });

  await prisma.workspaceInvitation.update({
    where: {
      id: invitationId,
    },
    data: {
      status: "ACCEPTED",
    },
  });

  return res.status(200).json({
    success: true,
    message: "Invitation accepted successfully",
    data: membership,
  });
};

const rejectInvitation: RequestHandler<WorkspaceParams> = async (req, res) => {
  const invitationId = Number(req.params.id);

  const invitation = await prisma.workspaceInvitation.findFirst({
    where: {
      id: invitationId,
      invitedUserId: req.user.userId,
      status: "PENDING",
    },
  });

  if (!invitation) {
    return res.status(404).json({
      success: false,
      message: "Invitation not found",
    });
  }

  await prisma.workspaceInvitation.update({
    where: {
      id: invitationId,
    },
    data: {
      status: "REJECTED",
    },
  });

  return res.status(200).json({
    success: true,
    message: "Invitation rejected successfully",
  });
};

const getWorkspaceMembers: RequestHandler<WorkspaceParams> = async (req, res) => {
  const workspaceId = Number(req.params.id);

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

  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return res.status(200).json({
    success: true,
    data: members,
  });
};

const removeMember: RequestHandler<WorkspaceMemberParams> = async (req, res) => {
  const workspaceId = Number(req.params.id);
  const userId = Number(req.params.userId);

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      ownerId: req.user.userId,
    },
  });

  if (!workspace) {
    return res.status(403).json({
      success: false,
      message: "Only the workspace owner can remove members",
    });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
    },
  });

  if (!member) {
    return res.status(404).json({
      success: false,
      message: "Member not found",
    });
  }

  if (member.role === "OWNER") {
    return res.status(400).json({
      success: false,
      message: "Workspace owner cannot be removed",
    });
  }

  await prisma.workspaceMember.delete({
    where: {
      id: member.id,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
};

const updateMemberRole: RequestHandler<
  WorkspaceMemberParams,
  unknown,
  UpdateMemberRoleRequestBody
> = async (req, res) => {
  const workspaceId = Number(req.params.id);
  const userId = Number(req.params.userId);
  const { role } = req.body;

  if (!isEditableWorkspaceRole(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role",
    });
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      ownerId: req.user.userId,
    },
  });

  if (!workspace) {
    return res.status(403).json({
      success: false,
      message: "Only the workspace owner can change roles",
    });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
    },
  });

  if (!member) {
    return res.status(404).json({
      success: false,
      message: "Member not found",
    });
  }

  if (member.role === "OWNER") {
    return res.status(400).json({
      success: false,
      message: "Owner role cannot be changed",
    });
  }

  const updatedMember = await prisma.workspaceMember.update({
    where: {
      id: member.id,
    },
    data: {
      role,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Member role updated successfully",
    data: updatedMember,
  });
};

const getWorkspaceById: RequestHandler<WorkspaceParams> = async (req, res) => {
  const workspaceId = Number(req.params.id);

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      members: {
        some: {
          userId: req.user.userId,
        },
      },
    },
  });

  if (!workspace) {
    return res.status(404).json({
      success: false,
      message: "Workspace not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: workspace,
  });
};

const leaveWorkspace: RequestHandler<WorkspaceParams> = async (req, res) => {
  const workspaceId = Number(req.params.id);

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: req.user.userId,
    },
  });

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: "You are not a member of this workspace",
    });
  }

  if (membership.role === "OWNER") {
    return res.status(400).json({
      success: false,
      message: "Owner cannot leave the workspace",
    });
  }

  await prisma.workspaceMember.delete({
    where: {
      id: membership.id,
    },
  });

  return res.status(200).json({
    success: true,
    message: "You left the workspace successfully",
  });
};

export {
  acceptInvitation,
  createInvitation,
  createWorkspace,
  deleteWorkspace,
  getMyInvitations,
  getMyWorkspaces,
  getWorkspaceById,
  getWorkspaceMembers,
  leaveWorkspace,
  rejectInvitation,
  removeMember,
  updateMemberRole,
  updateWorkspace,
};
