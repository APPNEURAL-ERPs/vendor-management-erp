import { Role } from "../domain";

export const apiRoles: Role[] = ["owner", "admin", "delivery_manager", "dispatcher", "driver", "viewer"];

const permissionsByApiRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  delivery_manager: [
    "delivery.order.read", "delivery.order.write",
    "delivery.shipment.read", "delivery.shipment.write",
    "delivery.driver.read", "delivery.driver.write",
    "delivery.route.read", "delivery.route.write",
    "delivery.tracking.read", "delivery.proof.read", "delivery.proof.write",
    "delivery.analytics.read", "delivery.audit.read"
  ],
  dispatcher: [
    "delivery.order.read", "delivery.order.write",
    "delivery.shipment.read", "delivery.shipment.write",
    "delivery.driver.read", "delivery.route.read", "delivery.route.write",
    "delivery.tracking.read", "delivery.proof.read", "delivery.proof.write",
    "delivery.analytics.read"
  ],
  driver: [
    "delivery.order.read",
    "delivery.shipment.read",
    "delivery.tracking.read",
    "delivery.proof.read", "delivery.proof.write"
  ],
  viewer: [
    "delivery.order.read",
    "delivery.shipment.read",
    "delivery.tracking.read"
  ]
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

export function permissionsFor(role: Role): string[] {
  return permissionsByApiRole[role] ?? [];
}
