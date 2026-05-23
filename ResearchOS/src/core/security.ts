import { Role } from "../domain";
import { forbidden } from "./errors";

export const apiRoles: Role[] = ["owner", "admin", "research_admin", "researcher", "analyst", "viewer"];

const permissionsByRole: Record<Role, string[]> = {
  viewer: [
    "research.study.read",
    "research.question.read",
    "research.source.read",
    "research.note.read",
    "research.hypothesis.read",
    "research.evidence.read",
    "research.insight.read"
  ],
  analyst: [
    "research.study.read",
    "research.question.read",
    "research.source.read",
    "research.note.read",
    "research.hypothesis.read",
    "research.evidence.read",
    "research.insight.read",
    "research.report.read",
    "research.analytics.read"
  ],
  researcher: [
    "research.study.read",
    "research.study.write",
    "research.question.read",
    "research.question.write",
    "research.source.read",
    "research.source.write",
    "research.note.read",
    "research.note.write",
    "research.hypothesis.read",
    "research.hypothesis.write",
    "research.evidence.read",
    "research.evidence.write",
    "research.insight.read",
    "research.insight.write",
    "research.competitor.read",
    "research.competitor.write",
    "research.interview.read",
    "research.interview.write",
    "research.survey.read",
    "research.survey.write",
    "research.painpoint.read",
    "research.painpoint.write"
  ],
  research_admin: [
    "research.study.read",
    "research.study.write",
    "research.question.read",
    "research.question.write",
    "research.source.read",
    "research.source.write",
    "research.note.read",
    "research.note.write",
    "research.hypothesis.read",
    "research.hypothesis.write",
    "research.evidence.read",
    "research.evidence.write",
    "research.insight.read",
    "research.insight.write",
    "research.report.read",
    "research.report.write",
    "research.analytics.read",
    "research.analytics.write",
    "research.audit.read"
  ],
  admin: ["*"],
  owner: ["*"]
};

export function isRole(value: string): value is Role {
  return apiRoles.includes(value as Role);
}

export function hasPermission(role: Role, permission?: string): boolean {
  if (!permission) return true;
  const granted = permissionsByRole[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(role: Role, permission?: string): void {
  if (!hasPermission(role, permission)) {
    forbidden(`Role ${role} does not have permission ${permission ?? "required"}`);
  }
}

export function listPermissions(role: Role): string[] {
  return permissionsByRole[role] ?? [];
}
