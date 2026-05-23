import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { AuditService } from "../service";

export function registerRoutes(router: Router, service: AuditService): Router {
  router.get("/health", () => ({ service: "AuditOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/auditos/overview", ({ actor }) => service.overview(actor), "audit.overview.view");

  router.get("/auditos/events", ({ actor, query }) => service.listEvents(actor, query), "audit.event.read");
  router.post("/auditos/events", ({ body, actor }) => service.createEvent(body, actor), "audit.event.write");
  router.get("/auditos/events/:id", ({ params, actor }) => service.getEvent(params.id, actor), "audit.event.read");
  router.post("/auditos/search", ({ body, actor }) => service.searchEvents(body, actor), "audit.event.read");

  router.get("/auditos/events/:id/changesets", ({ params, actor }) => service.listChangeSets(params.id, actor), "audit.event.read");
  router.post("/auditos/events/:id/changesets", ({ params, body, actor }) => service.createChangeSet(body, params.id, actor), "audit.event.write");

  router.get("/auditos/actors", ({ actor }) => service.listActors(actor), "audit.event.read");
  router.post("/auditos/actors", ({ body, actor }) => service.createActor(body, actor), "audit.event.write");

  router.get("/auditos/targets", ({ actor }) => service.listTargets(actor), "audit.event.read");
  router.post("/auditos/targets", ({ body, actor }) => service.createTarget(body, undefined, actor), "audit.event.write");

  router.get("/auditos/evidence", ({ actor, query }) => service.listEvidence(actor, query), "audit.evidence.read");
  router.post("/auditos/evidence", ({ body, actor }) => service.createEvidence(body, actor), "audit.evidence.write");
  router.get("/auditos/evidence/:id", ({ params, actor }) => service.getEvidence(params.id, actor), "audit.evidence.read");
  router.patch("/auditos/evidence/:id", ({ params, body, actor }) => service.updateEvidence(params.id, body, actor), "audit.evidence.write");

  router.get("/auditos/retention-policies", ({ actor }) => service.listRetentionPolicies(actor), "audit.event.read");
  router.post("/auditos/retention-policies", ({ body, actor }) => service.createRetentionPolicy(body, actor), "audit.event.write");

  router.get("/auditos/reports", ({ actor }) => service.listReports(actor), "audit.report.read");
  router.post("/auditos/reports", ({ body, actor }) => service.createReport(body, actor), "audit.report.write");
  router.post("/auditos/reports/:id/generate", ({ params, actor }) => service.generateReport(params.id, actor), "audit.report.write");

  router.get("/auditos/investigations", ({ actor }) => service.listInvestigations(actor), "audit.investigation.read");
  router.post("/auditos/investigations", ({ body, actor }) => service.createInvestigation(body, actor), "audit.investigation.write");
  router.patch("/auditos/investigations/:id", ({ params, body, actor }) => service.updateInvestigation(params.id, body, actor), "audit.investigation.write");

  router.get("/auditos/integrity/check", ({ actor }) => service.checkIntegrity(actor), "audit.integrity.read");

  router.get("/auditos/audit", ({ actor }) => service.listAuditLogs(actor), "audit.audit.read");

  return router;
}
