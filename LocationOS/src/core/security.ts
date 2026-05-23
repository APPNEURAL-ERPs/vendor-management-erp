import { forbidden } from "./errors";

export type Role = "owner" | "admin" | "location_admin" | "location_manager" | "field_agent" | "viewer";

export function isRole(value: string): value is Role {
  return ["owner", "admin", "location_admin", "location_manager", "field_agent", "viewer"].includes(value);
}

const permissionsByRole: Record<Role, string[]> = {
  viewer: ["location.read", "location.search", "location.nearby"],
  field_agent: ["location.read", "location.write", "location.checkin", "location.search", "location.nearby", "location.fieldvisit.write"],
  location_manager: ["location.read", "location.write", "location.geocode", "location.route", "location.checkin", "location.search", "location.nearby", "location.fieldvisit.write", "location.zone.write", "location.venue.write"],
  location_admin: ["*"],
  admin: ["*"],
  owner: ["*"]
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
