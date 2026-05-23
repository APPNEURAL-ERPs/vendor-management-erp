import { Role } from "./domain";
import { forbidden } from "./errors";

const roles: Role[] = ["owner", "admin", "business_admin", "strategy_manager", "goal_manager", "viewer"];

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  business_admin: [
    "business.*"
  ],
  strategy_manager: [
    "business.read",
    "business.strategy.*",
    "business.model.*",
    "business.plan.*",
    "business.initiative.*",
    "business.swot.*",
    "business.competitor.*",
    "business.market.*",
    "business.pricing.*",
    "business.offer.*",
    "business.gtm.*",
    "business.roadmap.*"
  ],
  goal_manager: [
    "business.read",
    "business.goal.*",
    "business.okr.*",
    "business.scorecard.*",
    "business.decision.*",
    "business.risk.*",
    "business.process.*",
    "business.sop.*"
  ],
  viewer: [
    "business.read",
    "business.strategy.view",
    "business.model.view",
    "business.plan.view",
    "business.goal.view",
    "business.okr.view",
    "business.initiative.view",
    "business.decision.view",
    "business.scorecard.view",
    "business.risk.view"
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

const secretsRoles: Role[] = ["owner", "admin", "business_admin"];
export function canViewSecrets(role: Role): boolean {
  return secretsRoles.includes(role);
}
