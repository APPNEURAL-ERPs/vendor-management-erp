import { Role } from "../domain";
import { forbidden } from "./errors";

const roles: Role[] = ["owner", "admin", "template_admin", "template_builder", "template_viewer"];

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  template_admin: [
    "template.*"
  ],
  template_builder: [
    "template.read",
    "template.create",
    "template.update",
    "template.render",
    "template.validate",
    "category.read",
    "variable.read",
    "audit.read"
  ],
  template_viewer: [
    "template.read",
    "template.render",
    "template.overview.view",
    "category.read",
    "variable.read"
  ]
};

export function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}

export function hasPermission(role: Role, permission?: string): boolean {
  if (!permission) return true;
  const permissions = permissionsByRole[role] ?? [];
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;
  return permissions.some((item) => {
    if (!item.endsWith(".*")) return false;
    return permission.startsWith(item.slice(0, -1));
  });
}

export function requirePermission(role: Role, permission?: string): void {
  if (!hasPermission(role, permission)) forbidden(`Role '${role}' cannot access permission '${permission}'`);
}

export function permissionsFor(role: Role): string[] {
  return [...(permissionsByRole[role] ?? [])];
}
