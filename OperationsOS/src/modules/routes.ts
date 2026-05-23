import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { OperationsService } from "../service";

export function registerRoutes(router: Router, service: OperationsService): Router {
  router.get("/health", () => ({ service: "OperationsOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/operations/overview", ({ actor }) => service.overview(actor), "ops.task.read");

  router.get("/operations/tasks", ({ actor, query }) => service.listTasks(actor, query), "ops.task.read");
  router.post("/operations/tasks", ({ body, actor }) => service.createTask(body, actor), "ops.task.write");
  router.get("/operations/tasks/:id", ({ params, actor }) => service.listTasks(actor).then(tasks => tasks.find(t => t.id === params.id)), "ops.task.read");
  router.patch("/operations/tasks/:id", ({ params, body, actor }) => service.updateTask(params.id, body, actor), "ops.task.write");

  router.get("/operations/checklists", ({ actor, query }) => service.listChecklists(actor, query), "ops.checklist.read");
  router.post("/operations/checklists", ({ body, actor }) => service.createChecklist(body, actor), "ops.checklist.write");
  router.patch("/operations/checklists/:id/items/:itemId", ({ params, body, actor }) => service.updateChecklistItem(params.id, params.itemId, body, actor), "ops.checklist.write");

  router.get("/operations/sops", ({ actor, query }) => service.listSOPs(actor, query), "ops.sop.read");
  router.post("/operations/sops", ({ body, actor }) => service.createSOP(body, actor), "ops.sop.write");
  router.post("/operations/sops/executions", ({ body, actor }) => service.createSOPExecution(body, actor), "ops.sop.write");
  router.patch("/operations/sops/executions/:id", ({ params, body, actor }) => service.updateSOPExecution(params.id, body, actor), "ops.sop.write");

  router.get("/operations/processes", ({ actor, query }) => service.listProcesses(actor, query), "ops.process.read");
  router.post("/operations/processes", ({ body, actor }) => service.createProcess(body, actor), "ops.process.write");
  router.post("/operations/processes/executions", ({ body, actor }) => service.createProcessExecution(body, actor), "ops.process.write");

  router.get("/operations/issues", ({ actor, query }) => service.listIssues(actor, query), "ops.issue.read");
  router.post("/operations/issues", ({ body, actor }) => service.createIssue(body, actor), "ops.issue.write");
  router.patch("/operations/issues/:id", ({ params, body, actor }) => service.updateIssue(params.id, body, actor), "ops.issue.write");

  router.get("/operations/incidents", ({ actor, query }) => service.listIncidents(actor, query), "ops.incident.read");
  router.post("/operations/incidents", ({ body, actor }) => service.createIncident(body, actor), "ops.incident.write");
  router.patch("/operations/incidents/:id", ({ params, body, actor }) => service.updateIncident(params.id, body, actor), "ops.incident.write");

  router.get("/operations/resources", ({ actor, query }) => service.listResources(actor, query), "ops.resource.read");
  router.post("/operations/resources", ({ body, actor }) => service.createResource(body, actor), "ops.resource.write");

  router.get("/operations/sla-rules", ({ actor }) => service.listSLARules(actor), "ops.sla.read");
  router.post("/operations/sla-rules", ({ body, actor }) => service.createSLARule(body, actor), "ops.sla.write");

  router.get("/operations/calendar", ({ actor, query }) => service.listCalendarItems(actor, query), "ops.calendar.read");
  router.post("/operations/calendar", ({ body, actor }) => service.createCalendarItem(body, actor), "ops.calendar.write");

  router.post("/operations/reports/daily", ({ actor }) => service.generateDailyReport(actor), "ops.report.write");
  router.get("/operations/audit", ({ actor }) => service.listAuditLogs(actor), "ops.audit.read");

  return router;
}
