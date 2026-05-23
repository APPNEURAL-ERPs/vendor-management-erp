import { WorkflowRole } from "../domain";
import { forbidden } from "./errors";

const roles: WorkflowRole[] = ["owner", "admin", "workflow_admin", "workflow_designer", "workflow_operator", "workflow_viewer", "approver", "viewer"];

const permissionsByRole: Record<WorkflowRole, string[]> = {
  owner: ["*"],
  admin: ["*"],
  workflow_admin: [
    "workflow.*"
  ],
  workflow_designer: [
    "workflow.definition.*",
    "workflow.template.*",
    "workflow.view",
    "workflow.audit.read"
  ],
  workflow_operator: [
    "workflow.definition.read",
    "workflow.execution.*",
    "workflow.state.read",
    "workflow.step.read",
    "workflow.view",
    "workflow.audit.read"
  ],
  approver: [
    "workflow.approval.*",
    "workflow.escalation.*",
    "workflow.view"
  ],
  workflow_viewer: [
    "workflow.view",
    "workflow.overview.view",
    "workflow.definition.read",
    "workflow.execution.read",
    "workflow.state.read",
    "workflow.step.read",
    "workflow.approval.read",
    "workflow.audit.read"
  ],
  viewer: [
    "workflow.view",
    "workflow.overview.view",
    "workflow.definition.read",
    "workflow.execution.read",
    "workflow.state.read",
    "workflow.step.read",
    "workflow.approval.read",
    "workflow.audit.read"
  ]
};

export function isRole(value: string): value is WorkflowRole {
  return roles.includes(value as WorkflowRole);
}

export function hasPermission(role: WorkflowRole, permission?: string): boolean {
  if (!permission) return true;
  const permissions = permissionsByRole[role] ?? [];
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;
  return permissions.some((item) => {
    if (!item.endsWith(".*")) return false;
    return permission.startsWith(item.slice(0, -1));
  });
}

export function requirePermission(role: WorkflowRole, permission?: string): void {
  if (!hasPermission(role, permission)) forbidden(`Role '${role}' cannot access permission '${permission}'`);
}

export function permissionsFor(role: WorkflowRole): string[] {
  return [...(permissionsByRole[role] ?? [])];
}
