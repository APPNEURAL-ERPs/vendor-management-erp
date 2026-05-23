import { Role } from "./domain";
import { forbidden } from "./errors";

const roles: Role[] = ["owner", "admin", "ai_admin", "ai_engineer", "agent_operator", "knowledge_manager", "viewer"];

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  ai_admin: [
    "ai.*"
  ],
  ai_engineer: [
    "ai.overview.view",
    "ai.provider.view",
    "ai.model.*",
    "ai.prompt.*",
    "ai.kb.*",
    "ai.document.*",
    "ai.rag.*",
    "ai.agent.*",
    "ai.tool.*",
    "ai.guardrail.*",
    "ai.automation.*",
    "ai.evaluation.*",
    "ai.event.*",
    "ai.audit.view"
  ],
  agent_operator: [
    "ai.overview.view",
    "ai.model.view",
    "ai.prompt.view",
    "ai.prompt.render",
    "ai.kb.view",
    "ai.document.view",
    "ai.rag.query",
    "ai.llm.complete",
    "ai.agent.view",
    "ai.agent.run",
    "ai.tool.view",
    "ai.tool.run",
    "ai.conversation.*",
    "ai.guardrail.scan",
    "ai.event.create"
  ],
  knowledge_manager: [
    "ai.overview.view",
    "ai.kb.*",
    "ai.document.*",
    "ai.rag.query",
    "ai.prompt.view",
    "ai.agent.view",
    "ai.audit.view"
  ],
  viewer: [
    "ai.overview.view",
    "ai.provider.view",
    "ai.model.view",
    "ai.prompt.view",
    "ai.kb.view",
    "ai.document.view",
    "ai.agent.view",
    "ai.tool.view",
    "ai.guardrail.view",
    "ai.event.view"
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
