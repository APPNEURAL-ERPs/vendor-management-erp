import { RequestActor, Role } from "./domain";
import { forbidden } from "./errors";

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  agentic_admin: ["agentic.*", "finance.*", "sales.*", "support.*", "developer.*", "tools.*", "tool.*", "analytics.*"],
  agent_operator: [
    "agentic.overview.view",
    "agentic.agents.read",
    "agentic.agents.run",
    "agentic.tasks.manage",
    "agentic.memory.read",
    "agentic.tools.use",
    "agentic.approvals.read",
    "agentic.runs.read"
  ],
  agent_developer: [
    "agentic.overview.view",
    "agentic.agents.*",
    "agentic.tasks.manage",
    "agentic.memory.*",
    "agentic.tools.use",
    "agentic.evals.run",
    "agentic.runs.read",
    "developer.*",
    "tools.*",
    "tool.*"
  ],
  approval_manager: [
    "agentic.overview.view",
    "agentic.agents.read",
    "agentic.runs.read",
    "agentic.approvals.*",
    "agentic.trace.read"
  ],
  auditor: [
    "agentic.overview.view",
    "agentic.agents.read",
    "agentic.runs.read",
    "agentic.memory.read",
    "agentic.evals.run",
    "agentic.trace.read",
    "agentic.event.view",
    "agentic.audit.view"
  ],
  viewer: [
    "agentic.overview.view",
    "agentic.agents.read",
    "agentic.runs.read"
  ]
};

export function isRole(value: unknown): value is Role {
  return ["owner", "admin", "agentic_admin", "agent_operator", "agent_developer", "approval_manager", "auditor", "viewer"].includes(String(value));
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

export function requireActorPermission(actor: RequestActor, permission: string): void {
  requirePermission(actor.role, permission);
}

function matchesPermission(granted: string, required: string): boolean {
  if (granted === "*" || granted === required) return true;
  if (granted.endsWith(".*")) {
    const prefix = granted.slice(0, -2);
    return required === prefix || required.startsWith(`${prefix}.`);
  }
  return false;
}
