/**
 * Role-Based Access Control for PDF Editor
 * Defines user roles and their permissions
 */

import type { UserRole } from "./types";

export const DEFAULT_ROLES: Record<string, UserRole> = {
  admin: {
    id: "admin",
    name: "Administrator",
    permissions: {
      canEditText: true,
      canEditImages: true,
      canEditForms: true,
      canAddAnnotations: true,
      canAddSignatures: true,
      canManagePages: true,
      canMergeDocuments: true,
      canDeleteContent: true,
      canViewAuditLogs: true,
      canManageVersions: true,
      canExport: true,
    },
  },
  editor: {
    id: "editor",
    name: "Editor",
    permissions: {
      canEditText: true,
      canEditImages: true,
      canEditForms: true,
      canAddAnnotations: true,
      canAddSignatures: true,
      canManagePages: true,
      canMergeDocuments: false,
      canDeleteContent: true,
      canViewAuditLogs: false,
      canManageVersions: false,
      canExport: true,
    },
  },
  reviewer: {
    id: "reviewer",
    name: "Reviewer",
    permissions: {
      canEditText: false,
      canEditImages: false,
      canEditForms: false,
      canAddAnnotations: true,
      canAddSignatures: true,
      canManagePages: false,
      canMergeDocuments: false,
      canDeleteContent: false,
      canViewAuditLogs: false,
      canManageVersions: false,
      canExport: true,
    },
  },
  viewer: {
    id: "viewer",
    name: "Viewer",
    permissions: {
      canEditText: false,
      canEditImages: false,
      canEditForms: false,
      canAddAnnotations: false,
      canAddSignatures: false,
      canManagePages: false,
      canMergeDocuments: false,
      canDeleteContent: false,
      canViewAuditLogs: false,
      canManageVersions: false,
      canExport: true,
    },
  },
};

export function getRole(roleId: string): UserRole | undefined {
  return DEFAULT_ROLES[roleId];
}

export function hasPermission(
  role: UserRole | undefined,
  permission: keyof UserRole["permissions"]
): boolean {
  if (!role) return false;
  return role.permissions[permission] === true;
}

