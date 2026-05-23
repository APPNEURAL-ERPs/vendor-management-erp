import { Role } from "../domain";
import { forbidden } from "./errors";

const roles: Role[] = ["owner", "admin", "content_admin", "content_editor", "content_creator", "content_reviewer", "viewer"];

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  content_admin: ["content.*"],
  content_editor: [
    "content.overview.view",
    "content.strategy.*",
    "content.pillar.*",
    "content.topic.*",
    "content.calendar.*",
    "content.brief.*",
    "content.post.*",
    "content.blog.*",
    "content.carousel.*",
    "content.newsletter.*",
    "content.campaign.*",
    "content.template.*",
    "content.seo.*",
    "content.quality.*",
    "content.audit.view"
  ],
  content_creator: [
    "content.overview.view",
    "content.strategy.view",
    "content.pillar.view",
    "content.topic.view",
    "content.calendar.view",
    "content.brief.create",
    "content.post.create",
    "content.post.view",
    "content.blog.create",
    "content.blog.view",
    "content.carousel.create",
    "content.carousel.view",
    "content.newsletter.view",
    "content.template.view",
    "content.quality.check"
  ],
  content_reviewer: [
    "content.overview.view",
    "content.strategy.view",
    "content.pillar.view",
    "content.brief.view",
    "content.post.view",
    "content.blog.view",
    "content.approval.*",
    "content.audit.view"
  ],
  viewer: [
    "content.overview.view",
    "content.strategy.view",
    "content.pillar.view",
    "content.topic.view",
    "content.calendar.view",
    "content.post.view",
    "content.blog.view"
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
