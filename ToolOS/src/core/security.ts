import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  tool_admin: ["tool.*", "tools.*"],
  tool_developer: [
    "tool.overview.view",
    "tool.permission.view",
    "tool.definitions.*",
    "tool.executions.run",
    "tool.executions.view",
    "tool.policies.view",
    "tool.credentials.view",
    "tools.*"
  ],
  tool_operator: [
    "tool.overview.view",
    "tool.permission.view",
    "tool.definitions.view",
    "tool.executions.run",
    "tool.executions.view",
    "tool.approvals.view",
    "tools.pdf.generate",
    "tools.qr.generate",
    "tools.domain.check",
    "tools.brand.check"
  ],
  auditor: [
    "tool.overview.view",
    "tool.permission.view",
    "tool.definitions.view",
    "tool.executions.view",
    "tool.approvals.view",
    "tool.policies.view",
    "tool.credentials.view",
    "tool.event.view",
    "tool.audit.view"
  ],
  viewer: [
    "tool.overview.view",
    "tool.permission.view",
    "tool.definitions.view",
    "tool.executions.view"
  ]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "tool_admin", "tool_developer", "tool_operator", "auditor", "viewer"].includes(String(value));
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
