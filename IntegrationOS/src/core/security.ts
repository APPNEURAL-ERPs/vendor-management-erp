import { Role } from "./domain";

export const apiRoles: Role[] = [
  "owner",
  "admin",
  "integration_admin",
  "integration_engineer",
  "connector_manager",
  "webhook_operator",
  "viewer"
];

const permissionsByApiRole: Record<Role, string[]> = {
  viewer: [
    "integration.read",
    "integration.connectors.read",
    "integration.webhooks.read",
    "integration.sync.read"
  ],
  webhook_operator: [
    "integration.read",
    "integration.connectors.read",
    "integration.webhooks.read",
    "integration.webhooks.manage",
    "integration.sync.read"
  ],
  connector_manager: [
    "integration.read",
    "integration.connectors.read",
    "integration.connectors.manage",
    "integration.webhooks.read",
    "integration.sync.read"
  ],
  integration_engineer: [
    "integration.read",
    "integration.write",
    "integration.connectors.manage",
    "integration.webhooks.manage",
    "integration.sync.manage",
    "integration.oauth.manage"
  ],
  integration_admin: [
    "integration.read",
    "integration.write",
    "integration.connectors.manage",
    "integration.webhooks.manage",
    "integration.sync.manage",
    "integration.oauth.manage",
    "integration.marketplace.access"
  ],
  admin: ["*"],
  owner: ["*"]
};

export function isRole(value: string): value is Role {
  return apiRoles.includes(value as Role);
}

export function hasPermission(role: Role, permission?: string): boolean {
  if (!permission) return true;
  const granted = permissionsByApiRole[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(role: Role, permission?: string): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role ${role} does not have permission ${permission ?? "any"}`);
  }
}

export function listPermissions(role: Role): string[] {
  return permissionsByApiRole[role] ?? [];
}
