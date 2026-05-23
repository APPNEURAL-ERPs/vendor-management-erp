import { Router } from "../core/http";
import { GrowthService } from "../services/growth.service";
import { docs } from "../docs";

function queryToObject(query: URLSearchParams): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of query.entries()) result[key] = value;
  return result;
}

export function registerRoutes(router: Router, service: GrowthService): Router {
  router.get("/health", () => ({ status: "ok", service: "GrowthOS" }));
  router.get("/docs", () => docs(router.listRoutes()));
  router.get("/growthos/overview", ({ actor }) => service.overview(actor), "growth.read");
  router.get("/growthos/analytics", ({ actor }) => service.analytics(actor), "growth.analytics.read");

  router.get("/growthos/leads", ({ actor, query }) => service.listLeads(actor, queryToObject(query)), "growth.leads.read");
  router.post("/growthos/leads", ({ actor, body }) => service.createLead(actor, body), "growth.leads.write");
  router.get("/growthos/leads/:id", ({ actor, params }) => service.getLead(actor, params.id), "growth.leads.read");
  router.patch("/growthos/leads/:id", ({ actor, params, body }) => service.updateLead(actor, params.id, body), "growth.leads.write");
  router.post("/growthos/leads/:id/qualify", ({ actor, params }) => service.qualifyLead(actor, params.id), "growth.leads.write");
  router.post("/growthos/leads/:id/score", ({ actor, params }) => service.recalculateLeadScore(actor, params.id), "growth.leads.write");

  router.get("/growthos/segments", ({ actor }) => service.listSegments(actor), "growth.segments.read");
  router.post("/growthos/segments", ({ actor, body }) => service.createSegment(actor, body), "growth.segments.write");
  router.get("/growthos/segments/:id/evaluate", ({ actor, params }) => service.evaluateSegment(actor, params.id), "growth.segments.read");

  router.get("/growthos/campaigns", ({ actor }) => service.listCampaigns(actor), "growth.campaigns.read");
  router.post("/growthos/campaigns", ({ actor, body }) => service.createCampaign(actor, body), "growth.campaigns.write");
  router.post("/growthos/campaigns/:id/launch", ({ actor, params }) => service.launchCampaign(actor, params.id), "growth.campaigns.write");
  router.post("/growthos/campaigns/:id/complete", ({ actor, params }) => service.completeCampaign(actor, params.id), "growth.campaigns.write");
  router.post("/growthos/campaigns/:id/metrics", ({ actor, params, body }) => service.recordCampaignMetrics(actor, params.id, body), "growth.campaigns.write");

  router.get("/growthos/touchpoints", ({ actor }) => service.listTouchpoints(actor), "growth.read");
  router.post("/growthos/touchpoints", ({ actor, body }) => service.captureTouchpoint(actor, body), "growth.touchpoints.write");
  router.get("/growthos/conversions", ({ actor }) => service.listConversions(actor), "growth.analytics.read");
  router.post("/growthos/conversions", ({ actor, body }) => service.createConversion(actor, body), "growth.conversions.write");

  router.get("/growthos/funnels", ({ actor }) => service.listFunnels(actor), "growth.funnels.read");
  router.post("/growthos/funnels", ({ actor, body }) => service.createFunnel(actor, body), "growth.funnels.write");
  router.get("/growthos/funnel-memberships", ({ actor }) => service.listFunnelMemberships(actor), "growth.funnels.read");
  router.post("/growthos/funnels/:id/enroll", ({ actor, params, body }) => service.enrollLeadInFunnel(actor, params.id, body), "growth.funnels.write");
  router.patch("/growthos/funnel-memberships/:id/move", ({ actor, params, body }) => service.moveFunnelMembership(actor, params.id, body), "growth.funnels.write");
  router.post("/growthos/funnel-memberships/:id/close", ({ actor, params, body }) => service.closeFunnelMembership(actor, params.id, body), "growth.funnels.write");

  router.get("/growthos/landing-pages", ({ actor }) => service.listLandingPages(actor), "growth.read");
  router.post("/growthos/landing-pages", ({ actor, body }) => service.createLandingPage(actor, body), "growth.landingpages.write");
  router.post("/growthos/landing-pages/:id/publish", ({ actor, params }) => service.publishLandingPage(actor, params.id), "growth.landingpages.write");
  router.post("/growthos/landing-pages/:id/submit", ({ actor, params, body }) => service.submitLandingPage(actor, params.id, body), "growth.landingpages.write");

  router.get("/growthos/experiments", ({ actor }) => service.listExperiments(actor), "growth.analytics.read");
  router.post("/growthos/experiments", ({ actor, body }) => service.createExperiment(actor, body), "growth.experiments.write");
  router.post("/growthos/experiments/:id/start", ({ actor, params }) => service.startExperiment(actor, params.id), "growth.experiments.write");
  router.post("/growthos/experiments/:id/events", ({ actor, params, body }) => service.recordExperimentEvent(actor, params.id, body), "growth.experiments.write");
  router.get("/growthos/experiments/:id/analysis", ({ actor, params }) => service.analyzeExperiment(actor, params.id), "growth.analytics.read");

  router.get("/growthos/nurture-sequences", ({ actor }) => service.listNurtureSequences(actor), "growth.read");
  router.post("/growthos/nurture-sequences", ({ actor, body }) => service.createNurtureSequence(actor, body), "growth.nurture.write");
  router.post("/growthos/nurture-sequences/:id/enroll", ({ actor, params, body }) => service.enrollLeadInNurture(actor, params.id, body), "growth.nurture.write");
  router.post("/growthos/nurture-enrollments/:id/advance", ({ actor, params }) => service.advanceNurtureEnrollment(actor, params.id), "growth.nurture.write");

  router.get("/growthos/events", ({ actor }) => service.listEvents(actor), "growth.read");
  router.get("/growthos/audit-logs", ({ actor }) => service.listAuditLogs(actor), "growth.audit.read");
  return router;
}
