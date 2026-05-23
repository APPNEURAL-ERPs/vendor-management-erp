import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { AiosService } from "../services/aios.service";

export function registerRoutes(router: Router, service: AiosService): Router {
  router.get("/health", () => ({ service: "AIOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/aios/overview", ({ actor }) => service.overview(actor), "ai.overview.view");

  router.get("/aios/providers", ({ actor }) => service.listProviders(actor), "ai.provider.view");
  router.post("/aios/providers", ({ body, actor }) => service.createProvider(body, actor), "ai.provider.create");

  router.get("/aios/models", ({ actor }) => service.listModels(actor), "ai.model.view");
  router.post("/aios/models", ({ body, actor }) => service.createModel(body, actor), "ai.model.create");
  router.post("/aios/llm/complete", ({ body, actor }) => service.complete(body, actor), "ai.llm.complete");

  router.get("/aios/prompts", ({ actor, query }) => service.listPrompts(actor, query), "ai.prompt.view");
  router.post("/aios/prompts", ({ body, actor }) => service.createPrompt(body, actor), "ai.prompt.create");
  router.get("/aios/prompts/:id", ({ params, actor }) => service.getPrompt(params.id, actor), "ai.prompt.view");
  router.post("/aios/prompts/:id/versions", ({ params, body, actor }) => service.addPromptVersion(params.id, body, actor), "ai.prompt.update");
  router.post("/aios/prompts/:id/render", ({ params, body, actor }) => service.renderPrompt(params.id, body, actor), "ai.prompt.render");

  router.get("/aios/knowledge-bases", ({ actor }) => service.listKnowledgeBases(actor), "ai.kb.view");
  router.post("/aios/knowledge-bases", ({ body, actor }) => service.createKnowledgeBase(body, actor), "ai.kb.create");
  router.get("/aios/documents", ({ actor, query }) => service.listDocuments(actor, query), "ai.document.view");
  router.post("/aios/documents", ({ body, actor }) => service.addDocument(body, actor), "ai.document.create");
  router.post("/aios/documents/:id/reindex", ({ params, actor }) => service.reindexDocumentById(params.id, actor), "ai.document.update");
  router.post("/aios/search", ({ body, actor }) => service.searchKnowledge(body, actor), "ai.rag.query");
  router.post("/aios/rag/query", ({ body, actor }) => service.ragQuery(body, actor), "ai.rag.query");

  router.get("/aios/tools", ({ actor }) => service.listTools(actor), "ai.tool.view");
  router.post("/aios/tools", ({ body, actor }) => service.createTool(body, actor), "ai.tool.create");
  router.post("/aios/tools/:id/run", ({ params, body, actor }) => service.runTool(params.id, body, actor), "ai.tool.run");

  router.get("/aios/guardrails", ({ actor }) => service.listGuardrails(actor), "ai.guardrail.view");
  router.post("/aios/guardrails", ({ body, actor }) => service.createGuardrail(body, actor), "ai.guardrail.create");
  router.post("/aios/guardrails/scan", ({ body, actor }) => service.scanGuardrails(body, actor), "ai.guardrail.scan");

  router.get("/aios/agents", ({ actor, query }) => service.listAgents(actor, query), "ai.agent.view");
  router.post("/aios/agents", ({ body, actor }) => service.createAgent(body, actor), "ai.agent.create");
  router.get("/aios/agents/:id", ({ params, actor }) => service.getAgent(params.id, actor), "ai.agent.view");
  router.post("/aios/agents/:id/run", ({ params, body, actor }) => service.runAgent(params.id, body, actor), "ai.agent.run");
  router.get("/aios/agent-runs", ({ actor, query }) => service.listAgentRuns(actor, query), "ai.agent.view");

  router.get("/aios/conversations", ({ actor }) => service.listConversations(actor), "ai.conversation.view");
  router.post("/aios/conversations", ({ body, actor }) => service.createConversation(body, actor), "ai.conversation.create");
  router.get("/aios/conversations/:id", ({ params, actor }) => service.getConversation(params.id, actor), "ai.conversation.view");
  router.post("/aios/conversations/:id/messages", ({ params, body, actor }) => service.addConversationMessage(params.id, body, actor), "ai.conversation.create");

  router.get("/aios/automations", ({ actor }) => service.listAutomations(actor), "ai.automation.view");
  router.post("/aios/automations", ({ body, actor }) => service.createAutomation(body, actor), "ai.automation.create");
  router.post("/aios/events/ingest", ({ body, actor }) => service.ingestEvent(body, actor), "ai.event.create");
  router.get("/aios/events", ({ actor }) => service.listEvents(actor), "ai.event.view");

  router.get("/aios/evaluations", ({ actor }) => service.listEvaluationSuites(actor), "ai.evaluation.view");
  router.post("/aios/evaluations", ({ body, actor }) => service.createEvaluationSuite(body, actor), "ai.evaluation.create");
  router.post("/aios/evaluations/:id/run", ({ params, actor }) => service.runEvaluationSuite(params.id, actor), "ai.evaluation.run");

  router.get("/aios/audit", ({ actor }) => service.listAuditLogs(actor), "ai.audit.view");

  return router;
}
