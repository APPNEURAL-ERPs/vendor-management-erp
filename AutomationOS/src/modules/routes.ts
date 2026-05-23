import { Router } from "../core/http";
import { getPermissions } from "../core/security";
import { docs } from "../docs";
import { AutomationService } from "../services/automation.service";

export function registerRoutes(router: Router, service: AutomationService): Router {
  router.get("/health", () => ({ status: "ok", service: "AutomationOS", time: new Date().toISOString() }));
  router.get("/docs", () => docs());
  router.get("/routes", () => router.listRoutes());

  router.get("/automationos/overview", ({ actor }) => service.overview(actor), "automation.overview.view");
  router.get("/automationos/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }), "automation.permission.view");

  router.get("/automationos/workflows", ({ actor, query }) => service.listWorkflows(actor, query), "automation.workflow.view");
  router.post("/automationos/workflows", ({ body, actor }) => service.createWorkflow(body, actor), "automation.workflow.create");
  router.get("/automationos/workflows/:id", ({ params, actor }) => service.getWorkflow(params.id, actor), "automation.workflow.view");
  router.put("/automationos/workflows/:id", ({ params, body, actor }) => service.updateWorkflow(params.id, body, actor), "automation.workflow.update");
  router.patch("/automationos/workflows/:id/status", ({ params, body, actor }) => service.setWorkflowStatus(params.id, String(body?.status ?? "draft") as any, actor), "automation.workflow.update");
  router.delete("/automationos/workflows/:id", ({ params, actor }) => service.deleteWorkflow(params.id, actor), "automation.workflow.delete");
  router.post("/automationos/workflows/:id/run", ({ params, body, actor }) => service.runWorkflow(params.id, body, actor), "automation.workflow.run");

  router.post("/automationos/events/ingest", ({ body, actor }) => service.ingestEvent(body, actor), "automation.event.ingest");
  router.get("/automationos/events", ({ actor }) => service.listEvents(actor), "automation.event.view");
  router.post("/automationos/webhooks/:path", ({ params, body, actor }) => service.handleWebhook(params.path, body, actor), "automation.event.ingest");

  router.get("/automationos/executions", ({ actor, query }) => service.listExecutions(actor, query), "automation.execution.view");
  router.get("/automationos/executions/:id", ({ params, actor }) => service.getExecution(params.id, actor), "automation.execution.view");
  router.patch("/automationos/executions/:id/cancel", ({ params, body, actor }) => service.cancelExecution(params.id, body, actor), "automation.execution.cancel");

  router.get("/automationos/approvals", ({ actor, query }) => service.listApprovals(actor, query), "automation.approval.view");
  router.post("/automationos/approvals", ({ body, actor }) => service.createApproval(body, actor), "automation.approval.create");
  router.post("/automationos/approvals/:id/decision", ({ params, body, actor }) => service.decideApproval(params.id, body, actor), "automation.approval.decide");

  router.get("/automationos/tasks", ({ actor, query }) => service.listTasks(actor, query), "automation.task.view");
  router.post("/automationos/tasks", ({ body, actor }) => service.createTask(body, actor), "automation.task.create");
  router.patch("/automationos/tasks/:id/status", ({ params, body, actor }) => service.updateTaskStatus(params.id, body, actor), "automation.task.update");

  router.get("/automationos/schedules", ({ actor }) => service.listSchedules(actor), "automation.schedule.view");
  router.post("/automationos/schedules", ({ body, actor }) => service.createSchedule(body, actor), "automation.schedule.create");
  router.post("/automationos/schedules/:id/run", ({ params, actor }) => service.runSchedule(params.id, actor), "automation.schedule.run");
  router.post("/automationos/schedules/run-due", ({ actor }) => service.runDueSchedules(actor), "automation.schedule.run");

  router.get("/automationos/connectors", ({ actor }) => service.listConnectors(actor), "automation.connector.view");
  router.post("/automationos/connectors", ({ body, actor }) => service.createConnector(body, actor), "automation.connector.create");

  router.get("/automationos/notifications", ({ actor }) => service.listNotifications(actor), "automation.notification.view");
  router.get("/automationos/audit", ({ actor }) => service.auditLogs(actor), "automation.audit.view");

  return router;
}
