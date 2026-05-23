import { docs } from "../docs";
import { permissionsFor } from "../core/http";
import { Router } from "../core/http";
import { ExperienceService } from "../service";

export function registerRoutes(router: Router, service: ExperienceService): Router {
  router.get("/health", () => ({ service: "ExperienceOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/experienceos/overview", ({ actor }) => service.overview(actor), "experience.overview.view");

  router.get("/experienceos/personas", ({ actor, query }) => service.listPersonas(actor, query), "experience.persona.read");
  router.post("/experienceos/personas", ({ body, actor }) => service.createPersona(body, actor), "experience.persona.write");
  router.get("/experienceos/personas/:id", ({ params, actor }) => service.getPersona(params.id, actor), "experience.persona.read");

  router.get("/experienceos/journeys", ({ actor, query }) => service.listJourneys(actor, query), "experience.journey.read");
  router.post("/experienceos/journeys", ({ body, actor }) => service.createJourney(body, actor), "experience.journey.write");
  router.get("/experienceos/journeys/:id", ({ params, actor }) => service.getJourney(params.id, actor), "experience.journey.read");

  router.get("/experienceos/onboardings", ({ actor, query }) => service.listOnboardings(actor, query), "experience.onboarding.read");
  router.post("/experienceos/onboardings", ({ body, actor }) => service.createOnboarding(body, actor), "experience.onboarding.write");
  router.get("/experienceos/onboardings/:id", ({ params, actor }) => service.getOnboarding(params.id, actor), "experience.onboarding.read");

  router.get("/experienceos/flows", ({ actor, query }) => service.listFlows(actor, query), "experience.flow.read");
  router.post("/experienceos/flows", ({ body, actor }) => service.createFlow(body, actor), "experience.flow.write");
  router.get("/experienceos/flows/:id", ({ params, actor }) => service.getFlow(params.id, actor), "experience.flow.read");

  router.get("/experienceos/audits", ({ actor }) => service.listAudits(actor), "experience.audit.read");
  router.post("/experienceos/audits", ({ body, actor }) => service.createAudit(body, actor), "experience.audit.write");
  router.get("/experienceos/audits/:id", ({ params, actor }) => service.getAudit(params.id, actor), "experience.audit.read");

  router.get("/experienceos/ab-tests", ({ actor }) => service.listABTests(actor), "experience.abtest.read");
  router.post("/experienceos/ab-tests", ({ body, actor }) => service.createABTest(body, actor), "experience.abtest.write");
  router.get("/experienceos/ab-tests/:id", ({ params, actor }) => service.getABTest(params.id, actor), "experience.abtest.read");

  router.get("/experienceos/feedback", ({ actor, query }) => service.listFeedback(actor, query), "experience.feedback.read");
  router.post("/experienceos/feedback", ({ body, actor }) => service.createFeedback(body, actor), "experience.feedback.write");

  router.get("/experienceos/microcopy", ({ actor, query }) => service.listMicrocopy(actor, query), "experience.microcopy.read");
  router.post("/experienceos/microcopy", ({ body, actor }) => service.createMicrocopy(body, actor), "experience.microcopy.write");

  router.get("/experienceos/personalization-rules", ({ actor }) => service.listPersonalizationRules(actor), "experience.personalization.read");
  router.post("/experienceos/personalization-rules", ({ body, actor }) => service.createPersonalizationRule(body, actor), "experience.personalization.write");

  router.get("/experienceos/wireframes", ({ actor }) => service.listWireframes(actor), "experience.wireframe.read");
  router.post("/experienceos/wireframes", ({ body, actor }) => service.createWireframe(body, actor), "experience.wireframe.write");

  router.get("/experienceos/templates", ({ actor, query }) => service.listTemplates(actor, query), "experience.template.read");
  router.post("/experienceos/templates", ({ body, actor }) => service.createTemplate(body, actor), "experience.template.write");

  router.get("/experienceos/metrics", ({ actor }) => service.listMetrics(actor), "experience.metrics.read");
  router.post("/experienceos/metrics", ({ body, actor }) => service.createMetric(body, actor), "experience.metrics.write");

  router.get("/experienceos/accessibility-checks", ({ actor, query }) => service.listAccessibilityChecks(actor, query), "experience.accessibility.read");
  router.post("/experienceos/accessibility-checks", ({ body, actor }) => service.createAccessibilityCheck(body, actor), "experience.accessibility.write");

  router.get("/experienceos/audit", ({ actor }) => service.listAuditLogs(actor), "experience.audit.read");

  return router;
}
