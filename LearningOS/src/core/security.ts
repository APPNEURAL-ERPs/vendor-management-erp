import { Role } from "./domain";
import { forbidden } from "./errors";

export const roles: Role[] = ["viewer", "teacher", "coordinator", "academic_admin", "principal", "learning_admin", "admin", "owner", "auditor"];

const permissionsByRole: Record<Role, string[]> = {
  viewer: ["learning.read", "learning.analytics.read", "learning.students.read", "learning.classes.read", "learning.subjects.read"],
  teacher: ["learning.read", "learning.analytics.read", "learning.students.read", "learning.classes.read", "learning.subjects.read", "learning.attendance.write", "learning.assignments.write", "learning.submissions.write", "learning.exams.read", "learning.scores.write", "learning.timetable.read"],
  coordinator: ["learning.read", "learning.analytics.read", "learning.students.read", "learning.students.write", "learning.classes.read", "learning.classes.write", "learning.subjects.read", "learning.subjects.write", "learning.enrollments.write", "learning.attendance.write", "learning.assignments.write", "learning.submissions.write", "learning.exams.read", "learning.exams.write", "learning.scores.write", "learning.timetable.read", "learning.timetable.write", "learning.reportcards.write"],
  academic_admin: ["learning.read", "learning.analytics.read", "learning.students.read", "learning.students.write", "learning.classes.read", "learning.classes.write", "learning.subjects.read", "learning.subjects.write", "learning.enrollments.write", "learning.attendance.write", "learning.assignments.write", "learning.submissions.write", "learning.exams.read", "learning.exams.write", "learning.scores.write", "learning.timetable.read", "learning.timetable.write", "learning.reportcards.write", "learning.audit.read"],
  principal: ["learning.read", "learning.analytics.read", "learning.students.read", "learning.students.write", "learning.classes.read", "learning.classes.write", "learning.subjects.read", "learning.subjects.write", "learning.enrollments.write", "learning.attendance.write", "learning.assignments.write", "learning.submissions.write", "learning.exams.read", "learning.exams.write", "learning.scores.write", "learning.timetable.read", "learning.timetable.write", "learning.reportcards.write", "learning.audit.read"],
  learning_admin: ["*"],
  admin: ["*"],
  owner: ["*"],
  auditor: ["learning.read", "learning.analytics.read", "learning.students.read", "learning.classes.read", "learning.subjects.read", "learning.exams.read", "learning.timetable.read", "learning.audit.read"]
};

export function isRole(value: string): value is Role { return roles.includes(value as Role); }
export function hasPermission(role: Role, permission?: string): boolean { if (!permission) return true; const granted = permissionsByRole[role] ?? []; return granted.includes("*") || granted.includes(permission); }
export function requirePermission(role: Role, permission?: string): void { if (!hasPermission(role, permission)) forbidden(`Role ${role} does not have permission ${permission}`); }
export function listPermissions(role: Role): string[] { return permissionsByRole[role] ?? []; }
