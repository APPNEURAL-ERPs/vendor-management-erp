import { Router } from "../core/http";
import { getPermissions } from "../core/security";
import { docs } from "../docs";
import { PartnerService } from "../services/partneros.service";

export function registerRoutes(router: Router, service: PartnerService): Router {
  router.get("/health", () => ({ status: "ok", service: "PartnerOS", time: new Date().toISOString() }));
  router.get("/docs", () => docs());
  router.get("/routes", () => router.listRoutes());

  router.get("/partneros/overview", ({ actor }) => service.overview(actor), "partneros.overview.view");
  router.get("/partneros/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }), "partneros.permission.view");
  router.get("/partneros/items", ({ actor, query }) => service.listItems(actor, query), "partneros.item.view");
  router.post("/partneros/items", ({ body, actor }) => service.createItem(actor, body), "partneros.item.create");
  router.put("/partneros/items/:key", ({ params, body, actor }) => service.updateItem(actor, params.key, body), "partneros.item.update");
  router.delete("/partneros/items/:key", ({ params, actor }) => service.archiveItem(actor, params.key), "partneros.item.delete");
  router.get("/partneros/workflows", ({ actor }) => service.listWorkflows(actor), "partneros.workflow.view");
  router.post("/partneros/workflows", ({ body, actor }) => service.createWorkflow(actor, body), "partneros.workflow.create");
  router.post("/partneros/workflows/:key/start", ({ params, body, actor }) => service.startWorkflow(actor, params.key, body), "partneros.run.create");
  router.get("/partneros/runs", ({ actor }) => service.listRuns(actor), "partneros.run.view");
  router.patch("/partneros/runs/:id", ({ params, body, actor }) => service.updateRun(actor, params.id, body), "partneros.run.update");
  router.get("/partneros/policies", ({ actor }) => service.listPolicies(actor), "partneros.policy.view");
  router.post("/partneros/policies", ({ body, actor }) => service.createPolicy(actor, body), "partneros.policy.create");
  router.get("/partneros/events", ({ actor }) => service.listEvents(actor), "partneros.event.view");
  router.get("/partneros/audit", ({ actor }) => service.auditLogs(actor), "partneros.audit.view");
  return router;
}
