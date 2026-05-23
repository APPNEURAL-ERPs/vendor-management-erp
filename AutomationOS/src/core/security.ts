import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  automation_manager: [
    "automation.workflow.*",
    "automation.execution.*",
    "automation.event.*",
    "automation.approval.view",
    "automation.approval.create",
    "automation.task.*",
    "automation.schedule.*",
    "automation.connector.*",
    "automation.notification.view",
    "automation.audit.view",
    "automation.overview.view",
    "automation.permission.view"
  ],
  operator: [
    "automation.workflow.view",
    "automation.workflow.run",
    "automation.execution.view",
    "automation.execution.cancel",
    "automation.event.*",
    "automation.task.*",
    "automation.schedule.view",
    "automation.schedule.run",
    "automation.connector.view",
    "automation.notification.view",
    "automation.overview.view",
    "automation.permission.view"
  ],
  approver: [
    "automation.workflow.view",
    "automation.execution.view",
    "automation.approval.view",
    "automation.approval.decide",
    "automation.task.view",
    "automation.task.update",
    "automation.notification.view",
    "automation.overview.view",
    "automation.permission.view"
  ],
  viewer: [
    "automation.workflow.view",
    "automation.execution.view",
    "automation.approval.view",
    "automation.task.view",
    "automation.schedule.view",
    "automation.connector.view",
    "automation.notification.view",
    "automation.event.view",
    "automation.overview.view",
    "automation.permission.view"
  ]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "automation_manager", "operator", "approver", "viewer"].includes(String(value));
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
  if (!hasPermission(role, requiredPermission)) {
    forbidden(`Role '${role}' does not have permission '${requiredPermission}'`);
  }
}

function matchesPermission(granted: string, required: string): boolean {
  if (granted === "*" || granted === required) return true;
  if (granted.endsWith(".*")) {
    const prefix = granted.slice(0, -2);
    return required === prefix || required.startsWith(`${prefix}.`);
  }
  return false;
}
