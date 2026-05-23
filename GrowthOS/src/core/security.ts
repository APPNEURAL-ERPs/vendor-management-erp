import { Role } from "./domain";
import { forbidden } from "./errors";

export const roles: Role[] = ["viewer", "growth_rep", "marketer", "campaign_manager", "growth_manager", "growth_admin", "admin", "owner", "auditor"];

const permissionsByRole: Record<Role, string[]> = {
  viewer: ["growth.read", "growth.analytics.read", "growth.leads.read", "growth.campaigns.read", "growth.funnels.read"],
  growth_rep: ["growth.read", "growth.analytics.read", "growth.leads.read", "growth.leads.write", "growth.touchpoints.write", "growth.conversions.write", "growth.funnels.read", "growth.funnels.write"],
  marketer: ["growth.read", "growth.analytics.read", "growth.leads.read", "growth.leads.write", "growth.segments.read", "growth.segments.write", "growth.campaigns.read", "growth.campaigns.write", "growth.touchpoints.write", "growth.landingpages.write", "growth.nurture.write"],
  campaign_manager: ["growth.read", "growth.analytics.read", "growth.leads.read", "growth.leads.write", "growth.segments.read", "growth.segments.write", "growth.campaigns.read", "growth.campaigns.write", "growth.touchpoints.write", "growth.conversions.write", "growth.landingpages.write", "growth.experiments.write", "growth.nurture.write"],
  growth_manager: ["growth.read", "growth.analytics.read", "growth.leads.read", "growth.leads.write", "growth.segments.read", "growth.segments.write", "growth.campaigns.read", "growth.campaigns.write", "growth.funnels.read", "growth.funnels.write", "growth.touchpoints.write", "growth.conversions.write", "growth.landingpages.write", "growth.experiments.write", "growth.nurture.write", "growth.audit.read"],
  growth_admin: ["*"],
  admin: ["*"],
  owner: ["*"],
  auditor: ["growth.read", "growth.analytics.read", "growth.leads.read", "growth.segments.read", "growth.campaigns.read", "growth.funnels.read", "growth.audit.read"]
};

export function isRole(value: string): value is Role { return roles.includes(value as Role); }
export function hasPermission(role: Role, permission?: string): boolean { if (!permission) return true; const granted = permissionsByRole[role] ?? []; return granted.includes("*") || granted.includes(permission); }
export function requirePermission(role: Role, permission?: string): void { if (!hasPermission(role, permission)) forbidden(`Role ${role} does not have permission ${permission}`); }
export function listPermissions(role: Role): string[] { return permissionsByRole[role] ?? []; }
