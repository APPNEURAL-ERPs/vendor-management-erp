import { docs } from "../docs";
import { getPermissions } from "../core/security";
import { Router } from "../core/http";
import { AdminService } from "../service";

export function registerRoutes(router: Router, service: AdminService): Router {
  router.get("/health", () => ({ service: "AdminOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }));

  router.get("/adminos/overview", ({ actor }) => service.overview(actor), "admin.settings.read");

  router.get("/adminos/settings", ({ actor }) => service.listSettings(actor), "admin.settings.read");
  router.post("/adminos/settings", ({ body, actor }) => service.createSetting(actor, body), "admin.settings.write");
  router.get("/adminos/settings/:id", ({ params, actor }) => service.getSetting(actor, params.id), "admin.settings.read");
  router.patch("/adminos/settings/:id", ({ params, body, actor }) => service.updateSetting(actor, params.id, body), "admin.settings.write");
  router.delete("/adminos/settings/:id", ({ params, actor }) => service.deleteSetting(actor, params.id), "admin.settings.write");

  router.get("/adminos/org-units", ({ actor }) => service.listOrgUnits(actor), "admin.org.read");
  router.post("/adminos/org-units", ({ body, actor }) => service.createOrgUnit(actor, body), "admin.org.write");
  router.get("/adminos/org-units/:id", ({ params, actor }) => service.getOrgUnit(actor, params.id), "admin.org.read");
  router.patch("/adminos/org-units/:id", ({ params, body, actor }) => service.updateOrgUnit(actor, params.id, body), "admin.org.write");
  router.delete("/adminos/org-units/:id", ({ params, actor }) => service.deleteOrgUnit(actor, params.id), "admin.org.write");

  router.get("/adminos/requests", ({ actor }) => service.listRequests(actor), "admin.request.read");
  router.post("/adminos/requests", ({ body, actor }) => service.createRequest(actor, body), "admin.request.write");
  router.get("/adminos/requests/:id", ({ params, actor }) => service.getRequest(actor, params.id), "admin.request.read");
  router.patch("/adminos/requests/:id", ({ params, body, actor }) => service.updateRequest(actor, params.id, body), "admin.request.write");
  router.post("/adminos/requests/:id/comments", ({ params, body, actor }) => service.addRequestComment(actor, params.id, body), "admin.request.write");
  router.delete("/adminos/requests/:id", ({ params, actor }) => service.deleteRequest(actor, params.id), "admin.request.write");

  router.get("/adminos/resources", ({ actor }) => service.listResources(actor), "admin.resource.read");
  router.post("/adminos/resources", ({ body, actor }) => service.createResource(actor, body), "admin.resource.write");
  router.get("/adminos/resources/:id", ({ params, actor }) => service.getResource(actor, params.id), "admin.resource.read");
  router.patch("/adminos/resources/:id", ({ params, body, actor }) => service.updateResource(actor, params.id, body), "admin.resource.write");
  router.post("/adminos/resources/:id/allocate", ({ params, body, actor }) => service.allocateResource(actor, params.id, body), "admin.resource.write");
  router.delete("/adminos/resources/:id", ({ params, actor }) => service.deleteResource(actor, params.id), "admin.resource.write");

  router.get("/adminos/approvals", ({ actor }) => service.listApprovals(actor), "admin.approval.read");
  router.post("/adminos/approvals", ({ body, actor }) => service.createApproval(actor, body), "admin.approval.write");
  router.get("/adminos/approvals/:id", ({ params, actor }) => service.getApproval(actor, params.id), "admin.approval.read");
  router.post("/adminos/approvals/:id/process", ({ params, body, actor }) => service.processApproval(actor, params.id, body), "admin.approval.write");
  router.delete("/adminos/approvals/:id", ({ params, actor }) => service.deleteApproval(actor, params.id), "admin.approval.write");

  router.get("/adminos/audit", ({ actor }) => service.listAuditLogs(actor), "admin.audit.read");
  router.get("/adminos/events", ({ actor }) => service.listEvents(actor), "admin.audit.read");

  return router;
}
