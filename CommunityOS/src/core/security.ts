import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  communityos_admin: ["communityos.*"],
  manager: ["communityos.overview.view", "communityos.permission.view", "communityos.item.*", "communityos.workflow.*", "communityos.run.*", "communityos.policy.view", "communityos.event.view"],
  operator: ["communityos.overview.view", "communityos.permission.view", "communityos.item.view", "communityos.workflow.view", "communityos.run.*", "communityos.policy.view"],
  auditor: ["communityos.overview.view", "communityos.permission.view", "communityos.item.view", "communityos.workflow.view", "communityos.run.view", "communityos.policy.view", "communityos.event.view", "communityos.audit.view"],
  viewer: ["communityos.overview.view", "communityos.permission.view", "communityos.item.view", "communityos.workflow.view", "communityos.run.view", "communityos.policy.view"]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "communityos_admin", "manager", "operator", "auditor", "viewer"].includes(String(value));
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
