import { Router } from "../core/http";
import { getPermissions } from "../core/security";
import { docs } from "../docs";
import { ComplianceService } from "../services/complianceos.service";

export function registerRoutes(router: Router, service: ComplianceService): Router {
  router.get("/health", () => ({ status: "ok", service: "ComplianceOS", time: new Date().toISOString() }));
  router.get("/docs", () => docs());
  router.get("/routes", () => router.listRoutes());

  router.get("/complianceos/overview", ({ actor }) => service.overview(actor), "complianceos.overview.view");
  router.get("/complianceos/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }), "complianceos.permission.view");
  router.get("/complianceos/items", ({ actor, query }) => service.listItems(actor, query), "complianceos.item.view");
  router.post("/complianceos/items", ({ body, actor }) => service.createItem(actor, body), "complianceos.item.create");
  router.put("/complianceos/items/:key", ({ params, body, actor }) => service.updateItem(actor, params.key, body), "complianceos.item.update");
  router.delete("/complianceos/items/:key", ({ params, actor }) => service.archiveItem(actor, params.key), "complianceos.item.delete");
  router.get("/complianceos/workflows", ({ actor }) => service.listWorkflows(actor), "complianceos.workflow.view");
  router.post("/complianceos/workflows", ({ body, actor }) => service.createWorkflow(actor, body), "complianceos.workflow.create");
  router.post("/complianceos/workflows/:key/start", ({ params, body, actor }) => service.startWorkflow(actor, params.key, body), "complianceos.run.create");
  router.get("/complianceos/runs", ({ actor }) => service.listRuns(actor), "complianceos.run.view");
  router.patch("/complianceos/runs/:id", ({ params, body, actor }) => service.updateRun(actor, params.id, body), "complianceos.run.update");
  router.get("/complianceos/policies", ({ actor }) => service.listPolicies(actor), "complianceos.policy.view");
  router.post("/complianceos/policies", ({ body, actor }) => service.createPolicy(actor, body), "complianceos.policy.create");
  router.get("/complianceos/events", ({ actor }) => service.listEvents(actor), "complianceos.event.view");
  router.get("/complianceos/audit", ({ actor }) => service.auditLogs(actor), "complianceos.audit.view");
  return router;
}
