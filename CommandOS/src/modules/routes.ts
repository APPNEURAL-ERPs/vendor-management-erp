import { Router } from "../core/http";
import { getPermissions } from "../core/security";
import { docs } from "../docs";
import { CommandService } from "../services/command.service";

export function registerRoutes(router: Router, service: CommandService): Router {
  router.get("/health", () => ({ status: "ok", service: "CommandOS", time: new Date().toISOString() }));
  router.get("/docs", () => docs());
  router.get("/routes", () => router.listRoutes());

  router.get("/commandos/overview", ({ actor }) => service.overview(actor), "command.overview.view");
  router.get("/commandos/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }), "command.permission.view");

  router.get("/commandos/commands", ({ actor, query }) => service.listCommands(actor, query), "command.command.view");
  router.post("/commandos/commands", ({ body, actor }) => service.createCommand(actor, body), "command.command.create");
  router.get("/commandos/commands/:id", ({ params, actor }) => service.getCommand(actor, params.id), "command.command.view");
  router.put("/commandos/commands/:id", ({ params, body, actor }) => service.updateCommand(actor, params.id, body), "command.command.update");
  router.delete("/commandos/commands/:id", ({ params, actor }) => service.archiveCommand(actor, params.id), "command.command.delete");
  router.post("/commandos/commands/:id/execute", ({ params, body, actor }) => service.executeCommand(actor, params.id, body), "command.execution.create");

  router.get("/commandos/executions", ({ actor, query }) => service.listExecutions(actor, query), "command.execution.view");
  router.patch("/commandos/executions/:id/status", ({ params, body, actor }) => service.updateExecutionStatus(actor, params.id, body), "command.execution.update");

  router.get("/commandos/runbooks", ({ actor }) => service.listRunbooks(actor), "command.runbook.view");
  router.post("/commandos/runbooks", ({ body, actor }) => service.createRunbook(actor, body), "command.runbook.create");
  router.post("/commandos/runbooks/:id/start", ({ params, body, actor }) => service.startRunbook(actor, params.id, body), "command.runbook.run");
  router.get("/commandos/runbook-runs", ({ actor }) => service.listRunbookRuns(actor), "command.runbook.view");
  router.patch("/commandos/runbook-runs/:runId/steps/:stepId", ({ params, body, actor }) => service.updateRunbookStep(actor, params.runId, params.stepId, body), "command.runbook.step");

  router.get("/commandos/automation-rules", ({ actor }) => service.listAutomationRules(actor), "command.automation.view");
  router.post("/commandos/automation-rules", ({ body, actor }) => service.createAutomationRule(actor, body), "command.automation.create");
  router.post("/commandos/automation-rules/:key/trigger", ({ params, actor }) => service.triggerAutomation(actor, params.key), "command.automation.trigger");

  router.get("/commandos/schedules", ({ actor }) => service.listSchedules(actor), "command.schedule.view");
  router.post("/commandos/schedules", ({ body, actor }) => service.createSchedule(actor, body), "command.schedule.create");

  router.get("/commandos/incidents", ({ actor }) => service.listIncidents(actor), "command.incident.view");
  router.post("/commandos/incidents", ({ body, actor }) => service.openIncident(actor, body), "command.incident.create");
  router.patch("/commandos/incidents/:id", ({ params, body, actor }) => service.updateIncident(actor, params.id, body), "command.incident.update");

  router.get("/commandos/events", ({ actor }) => service.listEvents(actor), "command.event.view");
  router.get("/commandos/audit", ({ actor }) => service.auditLogs(actor), "command.audit.view");

  return router;
}
