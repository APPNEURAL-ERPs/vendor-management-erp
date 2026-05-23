import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  complianceos_admin: ["complianceos.*"],
  manager: ["complianceos.overview.view", "complianceos.permission.view", "complianceos.item.*", "complianceos.workflow.*", "complianceos.run.*", "complianceos.policy.view", "complianceos.event.view"],
  operator: ["complianceos.overview.view", "complianceos.permission.view", "complianceos.item.view", "complianceos.workflow.view", "complianceos.run.*", "complianceos.policy.view"],
  auditor: ["complianceos.overview.view", "complianceos.permission.view", "complianceos.item.view", "complianceos.workflow.view", "complianceos.run.view", "complianceos.policy.view", "complianceos.event.view", "complianceos.audit.view"],
  viewer: ["complianceos.overview.view", "complianceos.permission.view", "complianceos.item.view", "complianceos.workflow.view", "complianceos.run.view", "complianceos.policy.view"]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "complianceos_admin", "manager", "operator", "auditor", "viewer"].includes(String(value));
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
