import { Role } from "../domain";
import { forbidden } from "./errors";

export const roles: Role[] = ["owner", "admin", "ops_manager", "ops_engineer", "ops_analyst", "ops_viewer"];

const permissionsByRole: Record<Role, string[]> = {
  ops_viewer: ["ops.task.read", "ops.process.read", "ops.checklist.read", "ops.sop.read", "ops.issue.read", "ops.incident.read", "ops.sla.read", "ops.resource.read", "ops.report.read", "ops.calendar.read"],
  ops_analyst: ["ops.task.read", "ops.process.read", "ops.checklist.read", "ops.sop.read", "ops.issue.read", "ops.incident.read", "ops.sla.read", "ops.resource.read", "ops.report.read", "ops.calendar.read", "ops.audit.read"],
  ops_engineer: ["ops.task.read", "ops.task.write", "ops.process.read", "ops.process.write", "ops.checklist.read", "ops.checklist.write", "ops.sop.read", "ops.sop.write", "ops.issue.read", "ops.issue.write", "ops.incident.read", "ops.incident.write", "ops.sla.read", "ops.sla.write", "ops.resource.read", "ops.resource.write", "ops.report.read", "ops.calendar.read", "ops.calendar.write", "ops.audit.read"],
  ops_manager: ["ops.task.read", "ops.task.write", "ops.process.read", "ops.process.write", "ops.checklist.read", "ops.checklist.write", "ops.sop.read", "ops.sop.write", "ops.issue.read", "ops.issue.write", "ops.incident.read", "ops.incident.write", "ops.sla.read", "ops.sla.write", "ops.resource.read", "ops.resource.write", "ops.report.read", "ops.report.write", "ops.calendar.read", "ops.calendar.write", "ops.audit.read"],
  admin: ["*"],
  owner: ["*"]
};

export function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}

export function hasPermission(role: Role, permission?: string): boolean {
  if (!permission) return true;
  const granted = permissionsByRole[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(role: Role, permission?: string): void {
  if (!hasPermission(role, permission)) forbidden(`Role ${role} does not have permission ${permission}`);
}

export function permissionsFor(role: Role): string[] {
  return permissionsByRole[role] ?? [];
}
