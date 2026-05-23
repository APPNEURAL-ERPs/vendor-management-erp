import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  command_admin: [
    "command.*",
    "command.overview.view",
    "command.permission.view",
    "command.command.*",
    "command.execution.*",
    "command.runbook.*",
    "command.automation.*",
    "command.schedule.*",
    "command.incident.*",
    "command.event.view",
    "command.audit.view"
  ],
  operator: [
    "command.overview.view",
    "command.permission.view",
    "command.command.view",
    "command.execution.*",
    "command.runbook.view",
    "command.runbook.run",
    "command.runbook.step",
    "command.schedule.view",
    "command.incident.view",
    "command.incident.update",
    "command.event.view"
  ],
  incident_commander: [
    "command.overview.view",
    "command.permission.view",
    "command.command.view",
    "command.execution.*",
    "command.runbook.*",
    "command.automation.view",
    "command.schedule.view",
    "command.incident.*",
    "command.event.view",
    "command.audit.view"
  ],
  automation_manager: [
    "command.overview.view",
    "command.permission.view",
    "command.command.view",
    "command.command.create",
    "command.command.update",
    "command.execution.*",
    "command.runbook.*",
    "command.automation.*",
    "command.schedule.*",
    "command.incident.view",
    "command.event.view",
    "command.audit.view"
  ],
  auditor: [
    "command.overview.view",
    "command.permission.view",
    "command.command.view",
    "command.execution.view",
    "command.runbook.view",
    "command.automation.view",
    "command.schedule.view",
    "command.incident.view",
    "command.event.view",
    "command.audit.view"
  ],
  viewer: [
    "command.overview.view",
    "command.permission.view",
    "command.command.view",
    "command.execution.view",
    "command.runbook.view",
    "command.automation.view",
    "command.schedule.view",
    "command.incident.view"
  ]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "command_admin", "operator", "incident_commander", "automation_manager", "auditor", "viewer"].includes(String(value));
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
