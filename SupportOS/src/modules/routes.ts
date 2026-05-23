import { Router } from "../core/http";
import { getPermissions } from "../core/security";
import { docs } from "../docs";
import { SupportService } from "../services/supportos.service";

export function registerRoutes(router: Router, service: SupportService): Router {
  router.get("/health", () => ({ status: "ok", service: "SupportOS", time: new Date().toISOString() }));
  router.get("/docs", () => docs());
  router.get("/routes", () => router.listRoutes());

  router.get("/supportos/overview", ({ actor }) => service.overview(actor), "supportos.overview.view");
  router.get("/supportos/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }), "supportos.permission.view");
  router.get("/supportos/items", ({ actor, query }) => service.listItems(actor, query), "supportos.item.view");
  router.post("/supportos/items", ({ body, actor }) => service.createItem(actor, body), "supportos.item.create");
  router.put("/supportos/items/:key", ({ params, body, actor }) => service.updateItem(actor, params.key, body), "supportos.item.update");
  router.delete("/supportos/items/:key", ({ params, actor }) => service.archiveItem(actor, params.key), "supportos.item.delete");
  router.get("/supportos/workflows", ({ actor }) => service.listWorkflows(actor), "supportos.workflow.view");
  router.post("/supportos/workflows", ({ body, actor }) => service.createWorkflow(actor, body), "supportos.workflow.create");
  router.post("/supportos/workflows/:key/start", ({ params, body, actor }) => service.startWorkflow(actor, params.key, body), "supportos.run.create");
  router.get("/supportos/runs", ({ actor }) => service.listRuns(actor), "supportos.run.view");
  router.patch("/supportos/runs/:id", ({ params, body, actor }) => service.updateRun(actor, params.id, body), "supportos.run.update");
  router.get("/supportos/policies", ({ actor }) => service.listPolicies(actor), "supportos.policy.view");
  router.post("/supportos/policies", ({ body, actor }) => service.createPolicy(actor, body), "supportos.policy.create");
  router.get("/supportos/events", ({ actor }) => service.listEvents(actor), "supportos.event.view");
  router.get("/supportos/audit", ({ actor }) => service.auditLogs(actor), "supportos.audit.view");
  return router;
}
