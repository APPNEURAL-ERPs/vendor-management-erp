import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  dataos_admin: ["dataos.*"],
  manager: ["dataos.overview.view", "dataos.permission.view", "dataos.item.*", "dataos.workflow.*", "dataos.run.*", "dataos.policy.view", "dataos.event.view"],
  operator: ["dataos.overview.view", "dataos.permission.view", "dataos.item.view", "dataos.workflow.view", "dataos.run.*", "dataos.policy.view"],
  auditor: ["dataos.overview.view", "dataos.permission.view", "dataos.item.view", "dataos.workflow.view", "dataos.run.view", "dataos.policy.view", "dataos.event.view", "dataos.audit.view"],
  viewer: ["dataos.overview.view", "dataos.permission.view", "dataos.item.view", "dataos.workflow.view", "dataos.run.view", "dataos.policy.view"]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "dataos_admin", "manager", "operator", "auditor", "viewer"].includes(String(value));
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
