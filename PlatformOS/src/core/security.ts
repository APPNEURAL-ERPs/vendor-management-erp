import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  platform_admin: ["platform.*"],
  architect: [
    "platform.overview.view",
    "platform.permission.view",
    "platform.profile.*",
    "platform.service.*",
    "platform.environment.*",
    "platform.integration.*",
    "platform.flag.*",
    "platform.release.*",
    "platform.deployment.view",
    "platform.health.*",
    "platform.event.view",
    "platform.audit.view"
  ],
  ops_manager: [
    "platform.overview.view",
    "platform.permission.view",
    "platform.profile.view",
    "platform.service.view",
    "platform.service.update",
    "platform.environment.view",
    "platform.deployment.*",
    "platform.integration.view",
    "platform.flag.view",
    "platform.release.*",
    "platform.health.*",
    "platform.event.view"
  ],
  integration_manager: [
    "platform.overview.view",
    "platform.permission.view",
    "platform.profile.view",
    "platform.service.view",
    "platform.environment.view",
    "platform.integration.*",
    "platform.flag.view",
    "platform.deployment.view",
    "platform.health.view",
    "platform.event.view"
  ],
  auditor: [
    "platform.overview.view",
    "platform.permission.view",
    "platform.profile.view",
    "platform.service.view",
    "platform.environment.view",
    "platform.deployment.view",
    "platform.integration.view",
    "platform.flag.view",
    "platform.release.view",
    "platform.health.view",
    "platform.event.view",
    "platform.audit.view"
  ],
  viewer: [
    "platform.overview.view",
    "platform.permission.view",
    "platform.profile.view",
    "platform.service.view",
    "platform.environment.view",
    "platform.deployment.view",
    "platform.integration.view",
    "platform.flag.view",
    "platform.release.view",
    "platform.health.view"
  ]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "platform_admin", "architect", "ops_manager", "integration_manager", "auditor", "viewer"].includes(String(value));
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
