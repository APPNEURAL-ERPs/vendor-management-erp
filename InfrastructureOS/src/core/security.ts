import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  infrastructureos_admin: ["infrastructureos.*"],
  manager: ["infrastructureos.overview.view", "infrastructureos.permission.view", "infrastructureos.item.*", "infrastructureos.workflow.*", "infrastructureos.run.*", "infrastructureos.policy.view", "infrastructureos.event.view"],
  operator: ["infrastructureos.overview.view", "infrastructureos.permission.view", "infrastructureos.item.view", "infrastructureos.workflow.view", "infrastructureos.run.*", "infrastructureos.policy.view"],
  auditor: ["infrastructureos.overview.view", "infrastructureos.permission.view", "infrastructureos.item.view", "infrastructureos.workflow.view", "infrastructureos.run.view", "infrastructureos.policy.view", "infrastructureos.event.view", "infrastructureos.audit.view"],
  viewer: ["infrastructureos.overview.view", "infrastructureos.permission.view", "infrastructureos.item.view", "infrastructureos.workflow.view", "infrastructureos.run.view", "infrastructureos.policy.view"]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "infrastructureos_admin", "manager", "operator", "auditor", "viewer"].includes(String(value));
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
