import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  knowledgeos_admin: ["knowledgeos.*"],
  manager: ["knowledgeos.overview.view", "knowledgeos.permission.view", "knowledgeos.item.*", "knowledgeos.workflow.*", "knowledgeos.run.*", "knowledgeos.policy.view", "knowledgeos.event.view"],
  operator: ["knowledgeos.overview.view", "knowledgeos.permission.view", "knowledgeos.item.view", "knowledgeos.workflow.view", "knowledgeos.run.*", "knowledgeos.policy.view"],
  auditor: ["knowledgeos.overview.view", "knowledgeos.permission.view", "knowledgeos.item.view", "knowledgeos.workflow.view", "knowledgeos.run.view", "knowledgeos.policy.view", "knowledgeos.event.view", "knowledgeos.audit.view"],
  viewer: ["knowledgeos.overview.view", "knowledgeos.permission.view", "knowledgeos.item.view", "knowledgeos.workflow.view", "knowledgeos.run.view", "knowledgeos.policy.view"]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "knowledgeos_admin", "manager", "operator", "auditor", "viewer"].includes(String(value));
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
