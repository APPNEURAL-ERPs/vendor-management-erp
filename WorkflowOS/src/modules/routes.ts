import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { WorkflowService } from "../service";

export function registerRoutes(router: Router, service: WorkflowService): Router {
  router.get("/health", () => ({ service: "WorkflowOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/workflowos/overview", ({ actor }) => service.overview(actor), "workflow.overview.view");

  router.get("/workflowos/workflows", ({ actor, query }) => service.listWorkflows(actor, query), "workflow.definition.read");
  router.post("/workflowos/workflows", ({ body, actor }) => service.createWorkflow(body, actor), "workflow.definition.write");
  router.get("/workflowos/workflows/:id", ({ params, actor }) => service.getWorkflow(params.id, actor), "workflow.definition.read");
  router.patch("/workflowos/workflows/:id", ({ params, body, actor }) => service.updateWorkflow(params.id, body, actor), "workflow.definition.write");
  router.post("/workflowos/workflows/:id/publish", ({ params, actor }) => service.publishWorkflow(params.id, actor), "workflow.definition.write");
  router.post("/workflowos/workflows/:id/run", ({ params, body, actor }) => service.runWorkflow(params.id, body, actor), "workflow.execution.write");

  router.get("/workflowos/triggers", ({ actor, query }) => service.listTriggers(actor, query), "workflow.definition.read");
  router.post("/workflowos/workflows/:id/triggers", ({ params, body, actor }) => service.createTrigger(params.id, body, actor), "workflow.definition.write");

  router.get("/workflowos/steps", ({ actor, query }) => service.listSteps(actor, query), "workflow.definition.read");
  router.post("/workflowos/workflows/:id/steps", ({ params, body, actor }) => service.createStep(params.id, body, actor), "workflow.definition.write");

  router.get("/workflowos/transitions", ({ actor, query }) => service.listTransitions(actor, query), "workflow.definition.read");
  router.post("/workflowos/workflows/:id/transitions", ({ params, body, actor }) => service.createTransition(params.id, body, actor), "workflow.definition.write");

  router.get("/workflowos/executions", ({ actor, query }) => service.listExecutions(actor, query), "workflow.execution.read");
  router.get("/workflowos/executions/:id", ({ params, actor }) => service.getExecution(params.id, actor), "workflow.execution.read");
  router.post("/workflowos/executions/:id/cancel", ({ params, actor }) => service.cancelExecution(params.id, actor), "workflow.execution.write");
  router.post("/workflowos/executions/:id/retry", ({ params, actor }) => service.retryExecution(params.id, actor), "workflow.execution.write");

  router.get("/workflowos/step-results", ({ actor, query }) => service.listStepResults(actor, query), "workflow.step.read");
  router.get("/workflowos/step-results/:id", ({ params, actor }) => service.getStepResult(params.id, actor), "workflow.step.read");

  router.get("/workflowos/approvals", ({ actor, query }) => service.listApprovals(actor, query), "workflow.approval.read");
  router.get("/workflowos/approvals/:id", ({ params, actor }) => service.getApproval(params.id, actor), "workflow.approval.read");
  router.post("/workflowos/approvals/:id/approve", ({ params, body, actor }) => service.approveStep(params.id, body, actor), "workflow.approval.write");
  router.post("/workflowos/approvals/:id/reject", ({ params, body, actor }) => service.rejectApproval(params.id, body, actor), "workflow.approval.write");
  router.post("/workflowos/approvals/:id/escalate", ({ params, body, actor }) => service.escalateApproval(params.id, body, actor), "workflow.escalation.write");

  router.get("/workflowos/escalations", ({ actor, query }) => service.listEscalations(actor, query), "workflow.approval.read");
  router.get("/workflowos/escalations/:id", ({ params, actor }) => service.getEscalation(params.id, actor), "workflow.approval.read");
  router.post("/workflowos/escalations/:id/resolve", ({ params, actor }) => service.resolveEscalation(params.id, actor), "workflow.escalation.write");

  router.get("/workflowos/errors", ({ actor, query }) => service.listErrors(actor, query), "workflow.audit.read");
  router.post("/workflowos/errors/:id/resolve", ({ params, actor }) => service.resolveError(params.id, actor), "workflow.audit.write");

  router.post("/workflowos/events/ingest", ({ body, actor }) => {
    service.emitWorkflowEvent(body.type || "unknown", body.data || {}, actor);
    return { event: body.type, processed: true };
  }, "workflow.execution.write");

  router.get("/workflowos/audit", ({ actor }) => service.listAuditLogs(actor), "workflow.audit.read");

  return router;
}
