import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  viewer: [
    "governance.read",
    "governance.meeting.read",
    "governance.resolution.read",
    "governance.policy.read",
    "governance.director.read",
    "governance.committee.read",
    "governance.audit.read"
  ],
  director: [
    "governance.read",
    "governance.meeting.read",
    "governance.resolution.read",
    "governance.policy.read",
    "governance.director.read",
    "governance.committee.read",
    "governance.audit.read",
    "governance.decision.read"
  ],
  compliance_officer: [
    "governance.read",
    "governance.meeting.read",
    "governance.resolution.read",
    "governance.policy.write",
    "governance.policy.read",
    "governance.director.read",
    "governance.committee.read",
    "governance.audit.read",
    "governance.exception.read",
    "governance.exception.write",
    "governance.decision.read",
    "governance.risk.read",
    "governance.risk.write"
  ],
  board_secretary: [
    "governance.read",
    "governance.meeting.write",
    "governance.meeting.read",
    "governance.resolution.write",
    "governance.resolution.read",
    "governance.policy.read",
    "governance.director.read",
    "governance.committee.read",
    "governance.audit.read",
    "governance.exception.read",
    "governance.decision.read",
    "governance.decision.write"
  ],
  governance_admin: [
    "governance.read",
    "governance.meeting.write",
    "governance.resolution.write",
    "governance.policy.write",
    "governance.director.write",
    "governance.committee.write",
    "governance.audit.read",
    "governance.exception.write",
    "governance.decision.write",
    "governance.risk.write",
    "governance.raci.write",
    "governance.approval.write",
    "governance.review.write"
  ],
  admin: ["*"],
  owner: ["*"]
};

export const apiRoles: Role[] = ["viewer", "director", "compliance_officer", "board_secretary", "governance_admin", "admin", "owner"];

export function isRole(value: string): value is Role {
  return apiRoles.includes(value as Role);
}

export function permissionsFor(role: Role): string[] {
  const granted = permissionsByRole[role] ?? [];
  if (granted.includes("*")) return ["*"];
  return granted;
}

export function hasPermission(role: Role, permission?: string): boolean {
  if (!permission) return true;
  const granted = permissionsFor(role);
  return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(role: Role, permission?: string): void {
  if (!hasPermission(role, permission)) {
    forbidden(`Role ${role} does not have permission ${permission}`);
  }
}
