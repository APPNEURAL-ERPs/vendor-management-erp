import { Router } from "../core/http";
import { getPermissions } from "../core/security";
import { docs } from "../docs";
import { CommunityService } from "../services/communityos.service";

export function registerRoutes(router: Router, service: CommunityService): Router {
  router.get("/health", () => ({ status: "ok", service: "CommunityOS", time: new Date().toISOString() }));
  router.get("/docs", () => docs());
  router.get("/routes", () => router.listRoutes());

  router.get("/communityos/overview", ({ actor }) => service.overview(actor), "communityos.overview.view");
  router.get("/communityos/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }), "communityos.permission.view");
  router.get("/communityos/items", ({ actor, query }) => service.listItems(actor, query), "communityos.item.view");
  router.post("/communityos/items", ({ body, actor }) => service.createItem(actor, body), "communityos.item.create");
  router.put("/communityos/items/:key", ({ params, body, actor }) => service.updateItem(actor, params.key, body), "communityos.item.update");
  router.delete("/communityos/items/:key", ({ params, actor }) => service.archiveItem(actor, params.key), "communityos.item.delete");
  router.get("/communityos/workflows", ({ actor }) => service.listWorkflows(actor), "communityos.workflow.view");
  router.post("/communityos/workflows", ({ body, actor }) => service.createWorkflow(actor, body), "communityos.workflow.create");
  router.post("/communityos/workflows/:key/start", ({ params, body, actor }) => service.startWorkflow(actor, params.key, body), "communityos.run.create");
  router.get("/communityos/runs", ({ actor }) => service.listRuns(actor), "communityos.run.view");
  router.patch("/communityos/runs/:id", ({ params, body, actor }) => service.updateRun(actor, params.id, body), "communityos.run.update");
  router.get("/communityos/policies", ({ actor }) => service.listPolicies(actor), "communityos.policy.view");
  router.post("/communityos/policies", ({ body, actor }) => service.createPolicy(actor, body), "communityos.policy.create");
  router.get("/communityos/events", ({ actor }) => service.listEvents(actor), "communityos.event.view");
  router.get("/communityos/audit", ({ actor }) => service.auditLogs(actor), "communityos.audit.view");
  return router;
}
