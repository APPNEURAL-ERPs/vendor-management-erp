import { TaskState } from "./domain";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): TaskState {
  const now = nowIso(); const firstId = newId("task"); const secondId = newId("task");
  return { items: [
    { id: firstId, tenantId, createdAt: now, updatedAt: now, key: "task-registry", name: "Task Registry", description: "Starter registry item for TaskOS.", type: "Task", status: "active", ownerId: "system", tags: ["starter", "registry"], attributes: { purpose: "Tasks, assignments, checklists, action items, ownership, priorities, deadlines, dependencies, approvals, execution tracking, and productivity coordination." }, metadata: { source: "planning", toolsCatalog: "taskos-tools.md" } },
    { id: secondId, tenantId, createdAt: now, updatedAt: now, key: "task-lifecycle", name: "Task Lifecycle", description: "Starter lifecycle item for TaskOS operations.", type: "TaskBoard", status: "pending_review", ownerId: "system", tags: ["starter", "lifecycle"], attributes: { ownedEntities: ["Task","TaskBoard","Checklist","TaskComment","TaskDependency","TaskReminder","TaskApproval","TaskSLA"] }, metadata: { source: "planning", toolsCatalog: "taskos-tools.md" } }
  ], runs: [], events: [{ id: newId("event"), tenantId, createdAt: now, updatedAt: now, type: "task.seeded", source: "TaskOS", itemId: firstId, payload: { items: 2 } }], auditLogs: [] };
}
