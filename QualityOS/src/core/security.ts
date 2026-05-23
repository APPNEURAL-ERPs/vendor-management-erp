import { Role } from "./domain";
import { forbidden } from "./errors";

export const roles: Role[] = ["owner", "admin", "qa_manager", "qa_engineer", "tester", "viewer"];

const permissionsByRole: Record<Role, string[]> = {
  viewer: [
    "quality.item.read",
    "quality.process.read",
    "quality.checklist.read",
    "quality.test.read",
    "quality.bug.read",
    "quality.feedback.read",
    "quality.metric.read"
  ],
  tester: [
    "quality.item.read",
    "quality.process.read",
    "quality.checklist.read",
    "quality.test.read",
    "quality.test.execute",
    "quality.bug.read",
    "quality.feedback.read",
    "quality.metric.read"
  ],
  qa_engineer: [
    "quality.item.read",
    "quality.item.write",
    "quality.process.read",
    "quality.process.write",
    "quality.checklist.read",
    "quality.checklist.write",
    "quality.test.read",
    "quality.test.write",
    "quality.test.execute",
    "quality.bug.read",
    "quality.bug.write",
    "quality.feedback.read",
    "quality.feedback.write",
    "quality.metric.read",
    "quality.metric.write"
  ],
  qa_manager: [
    "quality.item.read",
    "quality.item.write",
    "quality.process.read",
    "quality.process.write",
    "quality.checklist.read",
    "quality.checklist.write",
    "quality.test.read",
    "quality.test.write",
    "quality.test.execute",
    "quality.bug.read",
    "quality.bug.write",
    "quality.feedback.read",
    "quality.feedback.write",
    "quality.metric.read",
    "quality.metric.write",
    "quality.report.read",
    "quality.report.write"
  ],
  admin: ["*"],
  owner: ["*"]
};

export function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}

export function permissionsFor(role: Role): string[] {
  return permissionsByRole[role] ?? [];
}

export function hasPermission(role: Role, permission?: string): boolean {
  if (!permission) return true;
  const granted = permissionsByRole[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(role: Role, permission?: string): void {
  if (!hasPermission(role, permission)) {
    forbidden(`Role ${role} does not have permission ${permission ?? "any"}`);
  }
}
