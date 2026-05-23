import { Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  career_admin: [
    "career.*",
    "career.overview.view",
    "career.permission.view",
    "career.job.*",
    "career.candidate.*",
    "career.resume.*",
    "career.application.*",
    "career.pipeline.*",
    "career.interview.*",
    "career.scorecard.*",
    "career.offer.*",
    "career.pool.*",
    "career.analytics.view",
    "career.match.view",
    "career.event.view",
    "career.audit.view"
  ],
  recruiter: [
    "career.overview.view",
    "career.permission.view",
    "career.job.view",
    "career.job.create",
    "career.job.update",
    "career.job.publish",
    "career.candidate.*",
    "career.resume.*",
    "career.application.*",
    "career.pipeline.view",
    "career.interview.*",
    "career.scorecard.view",
    "career.offer.view",
    "career.offer.create",
    "career.offer.send",
    "career.pool.*",
    "career.analytics.view",
    "career.match.view",
    "career.event.view"
  ],
  hiring_manager: [
    "career.overview.view",
    "career.permission.view",
    "career.job.view",
    "career.job.update",
    "career.candidate.view",
    "career.resume.view",
    "career.application.view",
    "career.application.update",
    "career.pipeline.view",
    "career.interview.*",
    "career.scorecard.*",
    "career.offer.view",
    "career.offer.approve",
    "career.analytics.view",
    "career.match.view",
    "career.event.view"
  ],
  interviewer: [
    "career.overview.view",
    "career.permission.view",
    "career.job.view",
    "career.candidate.view",
    "career.application.view",
    "career.pipeline.view",
    "career.interview.view",
    "career.interview.update",
    "career.scorecard.*"
  ],
  hr_manager: [
    "career.overview.view",
    "career.permission.view",
    "career.job.view",
    "career.candidate.view",
    "career.resume.view",
    "career.application.*",
    "career.pipeline.view",
    "career.interview.view",
    "career.scorecard.view",
    "career.offer.*",
    "career.pool.view",
    "career.analytics.view",
    "career.event.view"
  ],
  offer_manager: [
    "career.overview.view",
    "career.permission.view",
    "career.job.view",
    "career.candidate.view",
    "career.application.view",
    "career.offer.*",
    "career.analytics.view",
    "career.event.view"
  ],
  auditor: [
    "career.overview.view",
    "career.permission.view",
    "career.job.view",
    "career.candidate.view",
    "career.resume.view",
    "career.application.view",
    "career.pipeline.view",
    "career.interview.view",
    "career.scorecard.view",
    "career.offer.view",
    "career.pool.view",
    "career.analytics.view",
    "career.match.view",
    "career.event.view",
    "career.audit.view"
  ],
  viewer: [
    "career.overview.view",
    "career.permission.view",
    "career.job.view",
    "career.candidate.view",
    "career.application.view",
    "career.pipeline.view",
    "career.interview.view",
    "career.offer.view",
    "career.pool.view",
    "career.analytics.view"
  ]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "career_admin", "recruiter", "hiring_manager", "interviewer", "hr_manager", "offer_manager", "auditor", "viewer"].includes(String(value));
}

export function getPermissions(role: Role): string[] {
  return permissionsByRole[role] ?? [];
}

export function hasPermission(role: Role, requiredPermission?: string): boolean {
  if (!requiredPermission) return true;
  const rolePermissions = permissionsByRole[role] ?? [];
  return rolePermissions.some((permission) => matchesPermission(permission, requiredPermission));
}

export function requirePermission(role: Role, requiredPermission?: string): void {
  if (!hasPermission(role, requiredPermission)) {
    forbidden(`Role '${role}' does not have permission '${requiredPermission}'`);
  }
}

function matchesPermission(granted: string, required: string): boolean {
  if (granted === "*" || granted === required) return true;
  if (granted.endsWith(".*")) {
    const prefix = granted.slice(0, -2);
    return required === prefix || required.startsWith(`${prefix}.`);
  }
  return false;
}
