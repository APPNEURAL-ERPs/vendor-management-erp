import { Role } from "./domain";
import { forbidden } from "./errors";

export const roles: Role[] = ["owner", "admin", "analytics_admin", "analyst", "dashboard_viewer", "viewer"];

export function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  analytics_admin: [
    "analytics.dashboard.read", "analytics.dashboard.write", "analytics.dashboard.delete",
    "analytics.report.read", "analytics.report.write", "analytics.report.delete",
    "analytics.event.read", "analytics.event.write",
    "analytics.kpi.read", "analytics.kpi.write", "analytics.kpi.delete",
    "analytics.funnel.read", "analytics.funnel.write", "analytics.funnel.delete",
    "analytics.alert.read", "analytics.alert.write", "analytics.alert.delete",
    "analytics.forecast.read", "analytics.forecast.write",
    "analytics.goal.read", "analytics.goal.write",
    "analytics.segment.read", "analytics.segment.write",
    "analytics.cohort.read", "analytics.cohort.write",
    "analytics.insight.read", "analytics.insight.write",
    "analytics.audit.read"
  ],
  analyst: [
    "analytics.dashboard.read",
    "analytics.report.read",
    "analytics.event.read",
    "analytics.kpi.read",
    "analytics.funnel.read",
    "analytics.alert.read",
    "analytics.forecast.read",
    "analytics.goal.read",
    "analytics.segment.read",
    "analytics.cohort.read",
    "analytics.insight.read",
    "analytics.audit.read"
  ],
  dashboard_viewer: [
    "analytics.dashboard.read",
    "analytics.kpi.read",
    "analytics.report.read"
  ],
  viewer: [
    "analytics.dashboard.read",
    "analytics.kpi.read"
  ]
};

export function permissionsFor(role: Role): string[] {
  return permissionsByRole[role] ?? [];
}

export function hasPermission(role: Role, permission?: string): boolean {
  if (!permission) return true;
  const granted = permissionsByRole[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(role: Role, permission?: string): void {
  if (!hasPermission(role, permission)) forbidden(`Role ${role} does not have permission ${permission}`);
}
