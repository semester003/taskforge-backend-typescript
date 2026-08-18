import type { WorkspaceRole as PrismaWorkspaceRole } from "@prisma/client";

interface AuthenticatedUser {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

type WorkspaceRole = PrismaWorkspaceRole;

type RouteParams<Parameter extends string> = Record<Parameter, string>;

const editableWorkspaceRoles = ["ADMIN", "MEMBER"] as const satisfies readonly WorkspaceRole[];
type EditableWorkspaceRole = (typeof editableWorkspaceRoles)[number];

const isEditableWorkspaceRole = (role: unknown): role is EditableWorkspaceRole => {
  return editableWorkspaceRoles.some((workspaceRole) => workspaceRole === role);
};

export {
  editableWorkspaceRoles,
  isEditableWorkspaceRole,
  type AuthenticatedUser,
  type EditableWorkspaceRole,
  type RouteParams,
  type WorkspaceRole,
};
