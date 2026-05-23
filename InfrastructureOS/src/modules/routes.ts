import { Router } from "../core/http";
import { getPermissions } from "../core/security";
import { docs } from "../docs";
import { InfrastructureService } from "../services/infrastructureos.service";

export function registerRoutes(router: Router, service: InfrastructureService): Router {
  router.get("/health", () => ({ status: "ok", service: "InfrastructureOS", time: new Date().toISOString() }));
  router.get("/docs", () => docs());
  router.get("/routes", () => router.listRoutes());

  router.get("/infrastructureos/overview", ({ actor }) => service.overview(actor), "infrastructureos.overview.view");
  router.get("/infrastructureos/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }), "infrastructureos.permission.view");
  router.get("/infrastructureos/items", ({ actor, query }) => service.listItems(actor, query), "infrastructureos.item.view");
  router.post("/infrastructureos/items", ({ body, actor }) => service.createItem(actor, body), "infrastructureos.item.create");
  router.put("/infrastructureos/items/:key", ({ params, body, actor }) => service.updateItem(actor, params.key, body), "infrastructureos.item.update");
  router.delete("/infrastructureos/items/:key", ({ params, actor }) => service.archiveItem(actor, params.key), "infrastructureos.item.delete");
  router.get("/infrastructureos/workflows", ({ actor }) => service.listWorkflows(actor), "infrastructureos.workflow.view");
  router.post("/infrastructureos/workflows", ({ body, actor }) => service.createWorkflow(actor, body), "infrastructureos.workflow.create");
  router.post("/infrastructureos/workflows/:key/start", ({ params, body, actor }) => service.startWorkflow(actor, params.key, body), "infrastructureos.run.create");
  router.get("/infrastructureos/runs", ({ actor }) => service.listRuns(actor), "infrastructureos.run.view");
  router.patch("/infrastructureos/runs/:id", ({ params, body, actor }) => service.updateRun(actor, params.id, body), "infrastructureos.run.update");
  router.get("/infrastructureos/policies", ({ actor }) => service.listPolicies(actor), "infrastructureos.policy.view");
  router.post("/infrastructureos/policies", ({ body, actor }) => service.createPolicy(actor, body), "infrastructureos.policy.create");
  router.get("/infrastructureos/events", ({ actor }) => service.listEvents(actor), "infrastructureos.event.view");
  router.get("/infrastructureos/audit", ({ actor }) => service.auditLogs(actor), "infrastructureos.audit.view");
  return router;
}
