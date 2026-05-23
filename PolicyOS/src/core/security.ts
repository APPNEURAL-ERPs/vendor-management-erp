import { Role } from "../domain";
import { forbidden } from "./errors";

const roles: Role[] = ["owner", "admin", "policy_admin", "policy_manager", "compliance_manager", "auditor", "viewer"];

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  policy_admin: [
    "policy.*"
  ],
  policy_manager: [
    "policy.overview.view",
    "policy.read",
    "policy.write",
    "policy.publish",
    "policy.enforce",
    "policy.rule.*",
    "policy.decision.*",
    "policy.guardrail.*",
    "policy.exception.*",
    "policy.violation.*",
    "policy.acknowledgment.*",
    "policy.review.*",
    "policy.audit.view"
  ],
  compliance_manager: [
    "policy.overview.view",
    "policy.read",
    "policy.enforce",
    "policy.guardrail.*",
    "policy.violation.*",
    "policy.acknowledgment.*",
    "policy.review.*",
    "policy.audit.view"
  ],
  auditor: [
    "policy.overview.view",
    "policy.read",
    "policy.audit.view",
    "policy.enforcement.view"
  ],
  viewer: [
    "policy.overview.view",
    "policy.read"
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
