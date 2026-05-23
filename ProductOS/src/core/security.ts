import { Role } from "./domain";
import { forbidden } from "./errors";
export const roles: Role[] = ["viewer", "product_manager", "product_owner", "roadmap_planner", "release_manager", "bom_manager", "product_admin", "admin", "owner", "auditor"];
const permissionsByRole: Record<Role, string[]> = {
  viewer: ["product.read", "product.analytics.read"],
  product_manager: ["product.read", "product.analytics.read", "product.products.write", "product.requirements.write", "product.features.write", "product.backlog.write", "product.change.write"],
  product_owner: ["product.read", "product.analytics.read", "product.products.write", "product.lifecycle.write", "product.requirements.write", "product.requirements.approve", "product.features.write", "product.roadmap.write", "product.backlog.write", "product.change.write", "product.change.approve", "product.audit.read"],
  roadmap_planner: ["product.read", "product.analytics.read", "product.roadmap.write", "product.features.write", "product.backlog.write", "product.audit.read"],
  release_manager: ["product.read", "product.analytics.read", "product.versions.write", "product.releases.write", "product.releases.approve", "product.features.write", "product.audit.read"],
  bom_manager: ["product.read", "product.analytics.read", "product.components.write", "product.bom.write", "product.bom.approve", "product.audit.read"],
  product_admin: ["*"], admin: ["*"], owner: ["*"],
  auditor: ["product.read", "product.analytics.read", "product.audit.read"]
};
export function isRole(value: string): value is Role { return roles.includes(value as Role); }
export function hasPermission(role: Role, permission?: string): boolean { if (!permission) return true; const granted = permissionsByRole[role] ?? []; return granted.includes("*") || granted.includes(permission); }
export function requirePermission(role: Role, permission?: string): void { if (!hasPermission(role, permission)) forbidden(`Role ${role} does not have permission ${permission}`); }
export function listPermissions(role: Role): string[] { return permissionsByRole[role] ?? []; }
