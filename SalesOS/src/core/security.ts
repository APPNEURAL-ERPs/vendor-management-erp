import { Role } from "./domain";
import { forbidden } from "./errors";
export const roles: Role[] = ["viewer", "sales_rep", "sales_manager", "sales_ops", "quote_manager", "sales_admin", "admin", "owner", "auditor"];
const permissionsByRole: Record<Role, string[]> = {
  viewer: ["sales.read", "sales.analytics.read"],
  sales_rep: ["sales.read", "sales.analytics.read", "sales.leads.write", "sales.deals.write", "sales.quotes.write", "sales.activities.write"],
  sales_manager: ["sales.read", "sales.analytics.read", "sales.leads.write", "sales.deals.write", "sales.deals.close", "sales.quotes.write", "sales.quotes.approve", "sales.proposals.write", "sales.activities.write", "sales.forecasts.write", "sales.audit.read"],
  sales_ops: ["sales.read", "sales.analytics.read", "sales.pipeline.write", "sales.products.write", "sales.activities.write", "sales.forecasts.write", "sales.audit.read"],
  quote_manager: ["sales.read", "sales.analytics.read", "sales.quotes.write", "sales.quotes.approve", "sales.proposals.write", "sales.audit.read"],
  sales_admin: ["*"], admin: ["*"], owner: ["*"],
  auditor: ["sales.read", "sales.analytics.read", "sales.audit.read"]
};
export function isRole(value: string): value is Role { return roles.includes(value as Role); }
export function hasPermission(role: Role, permission?: string): boolean { if (!permission) return true; const granted = permissionsByRole[role] ?? []; return granted.includes("*") || granted.includes(permission); }
export function requirePermission(role: Role, permission?: string): void { if (!hasPermission(role, permission)) forbidden(`Role ${role} does not have permission ${permission}`); }
export function listPermissions(role: Role): string[] { return permissionsByRole[role] ?? []; }
