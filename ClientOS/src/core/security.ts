import { Role } from "./domain";
import { forbidden } from "./errors";

export const roles: Role[] = ["viewer", "sales_rep", "account_manager", "support_agent", "support_manager", "success_manager", "client_admin", "admin", "owner", "auditor"];

const permissionsByRole: Record<Role, string[]> = {
  viewer: ["client.read", "client.accounts.read", "client.contacts.read", "client.opportunities.read", "client.tickets.read", "client.analytics.read"],
  sales_rep: ["client.read", "client.accounts.read", "client.accounts.write", "client.contacts.read", "client.contacts.write", "client.opportunities.read", "client.opportunities.write", "client.notes.write", "client.interactions.write", "client.tasks.write", "client.analytics.read"],
  account_manager: ["client.read", "client.accounts.read", "client.accounts.write", "client.contacts.read", "client.contacts.write", "client.opportunities.read", "client.opportunities.write", "client.tickets.read", "client.notes.write", "client.interactions.write", "client.tasks.write", "client.segments.read", "client.analytics.read"],
  success_manager: ["client.read", "client.accounts.read", "client.accounts.write", "client.contacts.read", "client.contacts.write", "client.opportunities.read", "client.tickets.read", "client.tickets.write", "client.notes.write", "client.interactions.write", "client.tasks.write", "client.segments.read", "client.segments.write", "client.analytics.read"],
  support_agent: ["client.read", "client.accounts.read", "client.contacts.read", "client.tickets.read", "client.tickets.write", "client.notes.write", "client.interactions.write", "client.tasks.write", "client.analytics.read"],
  support_manager: ["client.read", "client.accounts.read", "client.accounts.write", "client.contacts.read", "client.contacts.write", "client.tickets.read", "client.tickets.write", "client.sla.read", "client.sla.write", "client.notes.write", "client.interactions.write", "client.tasks.write", "client.segments.read", "client.segments.write", "client.analytics.read"],
  client_admin: ["*"],
  admin: ["*"],
  owner: ["*"],
  auditor: ["client.read", "client.accounts.read", "client.contacts.read", "client.opportunities.read", "client.tickets.read", "client.sla.read", "client.analytics.read", "client.audit.read"]
};

export function isRole(value: string): value is Role { return roles.includes(value as Role); }
export function hasPermission(role: Role, permission?: string): boolean { if (!permission) return true; const granted = permissionsByRole[role] ?? []; return granted.includes("*") || granted.includes(permission); }
export function requirePermission(role: Role, permission?: string): void { if (!hasPermission(role, permission)) forbidden(`Role ${role} does not have permission ${permission}`); }
export function listPermissions(role: Role): string[] { return permissionsByRole[role] ?? []; }
