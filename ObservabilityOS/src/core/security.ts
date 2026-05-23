import { Role } from "./domain";
import { forbidden } from "./errors";

const roles: Role[] = ["owner", "admin", "ops_admin", "sre_engineer", "developer", "viewer"];

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  ops_admin: [
    "observability.*"
  ],
  sre_engineer: [
    "observability.logs.read",
    "observability.logs.write",
    "observability.metrics.read",
    "observability.traces.read",
    "observability.alerts.read",
    "observability.alerts.write",
    "observability.health.read",
    "observability.dashboard.read",
    "observability.dashboard.write",
    "observability.incident.read",
    "observability.incident.write",
    "observability.slo.read",
    "observability.slo.write",
    "observability.cost.read",
    "observability.audit.read"
  ],
  developer: [
    "observability.logs.read",
    "observability.metrics.read",
    "observability.traces.read",
    "observability.alerts.read",
    "observability.health.read",
    "observability.dashboard.read",
    "observability.incident.read",
    "observability.slo.read",
    "observability.cost.read"
  ],
  viewer: [
    "observability.logs.read",
    "observability.metrics.read",
    "observability.alerts.read",
    "observability.health.read",
    "observability.dashboard.read",
    "observability.incident.read"
  ]
};

export function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}

export function hasPermission(role: Role, permission?: string): boolean {
  if (!permission) return true;
  const permissions = permissionsByRole[role] ?? [];
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;
  return permissions.some((item) => {
    if (!item.endsWith(".*")) return false;
    return permission.startsWith(item.slice(0, -1));
  });
}

export function requirePermission(role: Role, permission?: string): void {
  if (!hasPermission(role, permission)) forbidden(`Role '${role}' cannot access permission '${permission}'`);
}

export function permissionsFor(role: Role): string[] {
  return [...(permissionsByRole[role] ?? [])];
}
