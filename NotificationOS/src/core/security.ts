import { Role } from "./domain";
import { forbidden } from "./errors";

export const apiRoles: Role[] = ["owner", "admin", "notification_admin", "notification_manager", "notification_operator", "viewer"];

const permissionsByApiRole: Record<Role, string[]> = {
  viewer: ["notification.read", "notification.preference.read"],
  notification_operator: [
    "notification.read",
    "notification.send",
    "notification.preference.read",
    "notification.delivery.read",
    "notification.queue.read"
  ],
  notification_manager: [
    "notification.read",
    "notification.write",
    "notification.send",
    "notification.template.manage",
    "notification.rule.manage",
    "notification.preference.manage",
    "notification.schedule.manage",
    "notification.delivery.read",
    "notification.queue.read",
    "notification.analytics.read"
  ],
  notification_admin: [
    "notification.read",
    "notification.write",
    "notification.send",
    "notification.template.manage",
    "notification.rule.manage",
    "notification.preference.manage",
    "notification.schedule.manage",
    "notification.campaign.manage",
    "notification.channel.manage",
    "notification.provider.manage",
    "notification.delivery.read",
    "notification.queue.manage",
    "notification.analytics.read",
    "notification.audit.read"
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
    forbidden(`Role ${role} does not have permission ${permission ?? "any"}`);
  }
}

export function listPermissions(role: Role): string[] {
  return permissionsByApiRole[role] ?? [];
}
