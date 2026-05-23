import { Router, permissionsFor } from "../core/http";
import { AgenticService } from "../service";

export function registerRoutes(router: Router, service: AgenticService): Router {
  router.get("/health", () => ({ service: "AgenticOS", status: "ok", version: "1.0.0" }));
  router.get("/docs", () => ({ service: "AgenticOS", version: "1.0.0", routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/agentic/overview", ({ actor }) => service.overview(actor), "agentic.agent.read");

  router.get("/agentic/agents", ({ actor, query }) => service.listAgents(actor, query), "agentic.agent.read");
  router.post("/agentic/agents", ({ body, actor }) => service.createAgent(body, actor), "agentic.agent.write");
  router.get("/agentic/agents/:id", ({ params, actor }) => service.getAgent(params.id, actor), "agentic.agent.read");
  router.patch("/agentic/agents/:id", ({ params, body, actor }) => service.updateAgent(params.id, body, actor), "agentic.agent.write");
  router.post("/agentic/agents/:id/run", ({ params, body, actor }) => service.runAgent(params.id, body, actor), "agentic.agent.run");

  router.get("/agentic/runs", ({ actor, query }) => service.listAgentRuns(actor, query), "agentic.agent.read");
  router.get("/agentic/runs/:id", ({ params, actor }) => service.getAgentRun(params.id, actor), "agentic.agent.read");
  router.post("/agentic/runs/:id/pause", ({ params, actor }) => service.pauseAgentRun(params.id, actor), "agentic.agent.run");
  router.post("/agentic/runs/:id/resume", ({ params, actor }) => service.resumeAgentRun(params.id, actor), "agentic.agent.run");
  router.post("/agentic/runs/:id/cancel", ({ params, actor }) => service.cancelAgentRun(params.id, actor), "agentic.agent.run");

  router.get("/agentic/templates", ({ actor }) => service.listTemplates(actor), "agentic.template.read");
  router.post("/agentic/templates", ({ body, actor }) => service.createTemplate(body, actor), "agentic.template.write");

  router.get("/agentic/workflows", ({ actor }) => service.listWorkflows(actor), "agentic.workflow.read");
  router.post("/agentic/workflows", ({ body, actor }) => service.createWorkflow(body, actor), "agentic.workflow.write");

  router.get("/agentic/tools", ({ actor }) => service.listToolRegistry(actor), "agentic.tool.read");
  router.post("/agentic/tools", ({ body, actor }) => service.registerTool(body, actor), "agentic.tool.write");
  router.post("/agentic/tools/:id/run", ({ params, body, actor }) => service.runTool(params.id, body, actor), "agentic.tool.write");

  router.get("/agentic/guardrails", ({ actor }) => service.listGuardrails(actor), "agentic.guardrail.read");
  router.post("/agentic/guardrails", ({ body, actor }) => service.createGuardrail(body, actor), "agentic.guardrail.write");

  router.get("/agentic/approvals", ({ actor }) => service.listApprovalRequests(actor), "agentic.approval.manage");
  router.post("/agentic/approvals", ({ body, actor }) => service.createApprovalRequest(body, actor), "agentic.approval.manage");
  router.post("/agentic/approvals/:id/respond", ({ params, body, actor }) => service.respondToApproval(params.id, body, actor), "agentic.approval.manage");

  router.get("/agentic/memory", ({ actor, query }) => service.listMemory(actor, query), "agentic.memory.read");
  router.post("/agentic/memory", ({ body, actor }) => service.createMemory(body, actor), "agentic.memory.write");
  router.post("/agentic/memory/search", ({ body, actor }) => service.searchMemory(body, actor), "agentic.memory.read");

  router.get("/agentic/evaluations", ({ actor }) => service.listEvaluations(actor), "agentic.evaluation.read");
  router.post("/agentic/evaluations", ({ body, actor }) => service.createEvaluation(body, actor), "agentic.evaluation.write");
  router.post("/agentic/evaluations/:id/run", ({ params, actor }) => service.runEvaluation(params.id, actor), "agentic.evaluation.write");

  router.get("/agentic/events", ({ actor }) => service.listEvents(actor), "agentic.agent.read");
  router.get("/agentic/audit", ({ actor }) => service.listAuditLogs(actor), "agentic.audit.read");

  return router;
}
