import { AuditRole } from "../domain";
import { forbidden } from "./errors";

const roles: AuditRole[] = ["owner", "admin", "audit_admin", "compliance_manager", "security_analyst", "auditor", "viewer"];

const permissionsByRole: Record<AuditRole, string[]> = {
  owner: ["*"],
  admin: ["*"],
  audit_admin: [
    "audit.*",
    "audit.event.*",
    "audit.evidence.*",
    "audit.report.*",
    "audit.investigation.*",
    "audit.integrity.*",
    "audit.search.*"
  ],
  compliance_manager: [
    "audit.event.read",
    "audit.evidence.*",
    "audit.report.*",
    "audit.search.read",
    "audit.audit.read"
  ],
  security_analyst: [
    "audit.event.read",
    "audit.evidence.read",
    "audit.search.read",
    "audit.audit.read",
    "audit.investigation.read"
  ],
  auditor: [
    "audit.event.read",
    "audit.evidence.read",
    "audit.report.read",
    "audit.search.read",
    "audit.audit.read",
    "audit.integrity.read"
  ],
  viewer: [
    "audit.event.read",
    "audit.evidence.read",
    "audit.audit.read"
  ]
};

export function isAuditRole(value: string): value is AuditRole {
  return roles.includes(value as AuditRole);
}

export function hasPermission(role: AuditRole, permission?: string): boolean {
  if (!permission) return true;
  const permissions = permissionsByRole[role] ?? [];
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;
  return permissions.some((item) => {
    if (!item.endsWith(".*")) return false;
    return permission.startsWith(item.slice(0, -1));
  });
}

export function requirePermission(role: AuditRole, permission?: string): void {
  if (!hasPermission(role, permission)) forbidden(`Role '${role}' cannot access permission '${permission}'`);
}

export function permissionsFor(role: AuditRole): string[] {
  return [...(permissionsByRole[role] ?? [])];
}
