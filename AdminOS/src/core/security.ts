import { AdminRole } from "../domain";
import { forbidden } from "./errors";

export const apiRoles: AdminRole[] = ["viewer", "admin", "org_admin", "approval_manager", "resource_manager", "owner"];

export function isRole(value: string): value is AdminRole {
  return apiRoles.includes(value as AdminRole);
}

const permissionsByRole: Record<AdminRole, string[]> = {
  viewer: ["admin.settings.read", "admin.org.read", "admin.request.read", "admin.resource.read", "admin.approval.read", "admin.audit.read"],
  admin: ["*"],
  org_admin: ["admin.settings.read", "admin.settings.write", "admin.org.read", "admin.org.write", "admin.request.read", "admin.request.write", "admin.audit.read"],
  approval_manager: ["admin.approval.read", "admin.approval.write", "admin.request.read", "admin.audit.read"],
  resource_manager: ["admin.resource.read", "admin.resource.write", "admin.request.read", "admin.audit.read"],
  owner: ["*"]
};

export function getPermissions(role: AdminRole): string[] {
  return permissionsByRole[role] ?? [];
}

export function permissionsFor(role: AdminRole): string[] {
  return getPermissions(role);
}

export function hasPermission(role: AdminRole, permission?: string): boolean {
  if (!permission) return true;
  const granted = permissionsByRole[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(role: AdminRole, permission?: string): void {
  if (!hasPermission(role, permission)) {
    forbidden(`Role ${role} does not have permission ${permission}`);
  }
}
