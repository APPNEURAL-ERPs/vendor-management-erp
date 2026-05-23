import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  partneros_admin: ["partneros.*"],
  manager: ["partneros.overview.view", "partneros.permission.view", "partneros.item.*", "partneros.workflow.*", "partneros.run.*", "partneros.policy.view", "partneros.event.view"],
  operator: ["partneros.overview.view", "partneros.permission.view", "partneros.item.view", "partneros.workflow.view", "partneros.run.*", "partneros.policy.view"],
  auditor: ["partneros.overview.view", "partneros.permission.view", "partneros.item.view", "partneros.workflow.view", "partneros.run.view", "partneros.policy.view", "partneros.event.view", "partneros.audit.view"],
  viewer: ["partneros.overview.view", "partneros.permission.view", "partneros.item.view", "partneros.workflow.view", "partneros.run.view", "partneros.policy.view"]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "partneros_admin", "manager", "operator", "auditor", "viewer"].includes(String(value));
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
