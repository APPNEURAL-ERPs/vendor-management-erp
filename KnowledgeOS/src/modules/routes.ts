import { Router } from "../core/http";
import { getPermissions } from "../core/security";
import { docs } from "../docs";
import { KnowledgeService } from "../services/knowledgeos.service";

export function registerRoutes(router: Router, service: KnowledgeService): Router {
  router.get("/health", () => ({ status: "ok", service: "KnowledgeOS", time: new Date().toISOString() }));
  router.get("/docs", () => docs());
  router.get("/routes", () => router.listRoutes());

  router.get("/knowledgeos/overview", ({ actor }) => service.overview(actor), "knowledgeos.overview.view");
  router.get("/knowledgeos/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }), "knowledgeos.permission.view");
  router.get("/knowledgeos/items", ({ actor, query }) => service.listItems(actor, query), "knowledgeos.item.view");
  router.post("/knowledgeos/items", ({ body, actor }) => service.createItem(actor, body), "knowledgeos.item.create");
  router.put("/knowledgeos/items/:key", ({ params, body, actor }) => service.updateItem(actor, params.key, body), "knowledgeos.item.update");
  router.delete("/knowledgeos/items/:key", ({ params, actor }) => service.archiveItem(actor, params.key), "knowledgeos.item.delete");
  router.get("/knowledgeos/workflows", ({ actor }) => service.listWorkflows(actor), "knowledgeos.workflow.view");
  router.post("/knowledgeos/workflows", ({ body, actor }) => service.createWorkflow(actor, body), "knowledgeos.workflow.create");
  router.post("/knowledgeos/workflows/:key/start", ({ params, body, actor }) => service.startWorkflow(actor, params.key, body), "knowledgeos.run.create");
  router.get("/knowledgeos/runs", ({ actor }) => service.listRuns(actor), "knowledgeos.run.view");
  router.patch("/knowledgeos/runs/:id", ({ params, body, actor }) => service.updateRun(actor, params.id, body), "knowledgeos.run.update");
  router.get("/knowledgeos/policies", ({ actor }) => service.listPolicies(actor), "knowledgeos.policy.view");
  router.post("/knowledgeos/policies", ({ body, actor }) => service.createPolicy(actor, body), "knowledgeos.policy.create");
  router.get("/knowledgeos/events", ({ actor }) => service.listEvents(actor), "knowledgeos.event.view");
  router.get("/knowledgeos/audit", ({ actor }) => service.auditLogs(actor), "knowledgeos.audit.view");
  return router;
}
