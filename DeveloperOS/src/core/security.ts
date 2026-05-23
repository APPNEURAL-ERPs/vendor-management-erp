import { Role } from "./domain";
import { forbidden } from "./errors";

export const roles: Role[] = ["owner", "admin", "dev_admin", "developer", "release_manager", "security_reviewer", "support_engineer", "auditor", "viewer"];

const permissionsByRole: Record<Role, string[]> = {
  viewer: ["dev.read", "dev.docs.read", "dev.apis.read"],
  developer: ["dev.read", "dev.apps.read", "dev.apps.write", "dev.keys.read", "dev.keys.write", "dev.apis.read", "dev.sdks.read", "dev.webhooks.read", "dev.webhooks.write", "dev.docs.read", "dev.usage.write"],
  support_engineer: ["dev.read", "dev.apps.read", "dev.keys.read", "dev.apis.read", "dev.webhooks.read", "dev.webhooks.write", "dev.usage.read", "dev.events.read"],
  release_manager: ["dev.read", "dev.apis.read", "dev.sdks.read", "dev.sdks.write", "dev.environments.read", "dev.environments.write", "dev.pipelines.read", "dev.pipelines.write", "dev.deployments.read", "dev.deployments.write", "dev.docs.read", "dev.changelog.write", "dev.events.read"],
  security_reviewer: ["dev.read", "dev.apps.read", "dev.keys.read", "dev.keys.write", "dev.apis.read", "dev.environments.read", "dev.audit.read", "dev.events.read"],
  auditor: ["dev.read", "dev.apps.read", "dev.keys.read", "dev.apis.read", "dev.sdks.read", "dev.webhooks.read", "dev.environments.read", "dev.pipelines.read", "dev.deployments.read", "dev.docs.read", "dev.usage.read", "dev.events.read", "dev.audit.read"],
  dev_admin: ["*"],
  admin: ["*"],
  owner: ["*"]
};

export function isRole(value: string): value is Role { return roles.includes(value as Role); }
export function hasPermission(role: Role, permission?: string): boolean { if (!permission) return true; const granted = permissionsByRole[role] ?? []; return granted.includes("*") || granted.includes(permission); }
export function requirePermission(role: Role, permission?: string): void { if (!hasPermission(role, permission)) forbidden(`Role ${role} does not have permission ${permission}`); }
export function listPermissions(role: Role): string[] { return permissionsByRole[role] ?? []; }
