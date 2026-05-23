import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  supportos_admin: ["supportos.*"],
  manager: ["supportos.overview.view", "supportos.permission.view", "supportos.item.*", "supportos.workflow.*", "supportos.run.*", "supportos.policy.view", "supportos.event.view"],
  operator: ["supportos.overview.view", "supportos.permission.view", "supportos.item.view", "supportos.workflow.view", "supportos.run.*", "supportos.policy.view"],
  auditor: ["supportos.overview.view", "supportos.permission.view", "supportos.item.view", "supportos.workflow.view", "supportos.run.view", "supportos.policy.view", "supportos.event.view", "supportos.audit.view"],
  viewer: ["supportos.overview.view", "supportos.permission.view", "supportos.item.view", "supportos.workflow.view", "supportos.run.view", "supportos.policy.view"]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "supportos_admin", "manager", "operator", "auditor", "viewer"].includes(String(value));
}

export function getPermissions(role: Role): string[] {
  return permissionsByRole[role] ?? [];
}

export function hasPermission(role: Role, requiredPermission?: string): boolean {
  if (!requiredPermission) return true;
  const rolePermissions = permissionsByRole[role] ?? [];
  return rolePermissions.some((permission) => matchesPermission(permission, requiredPermission));
}

export function requirePermission(role: Role, requiredPermission?: string): void {
  if (!hasPermission(role, requiredPermission)) forbidden(`Role '${role}' does not have permission '${requiredPermission}'`);
}

function matchesPermission(granted: string, required: string): boolean {
  if (granted === "*" || granted === required) return true;
  if (granted.endsWith(".*")) {
    const prefix = granted.slice(0, -2);
    return required === prefix || required.startsWith(`${prefix}.`);
  }
  return false;
}
