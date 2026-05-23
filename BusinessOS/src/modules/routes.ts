import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { BusinessService } from "../services/business.service";

export function registerRoutes(router: Router, service: BusinessService): Router {
  router.get("/health", () => ({ service: "BusinessOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/businessos/overview", ({ actor }) => service.overview(actor), "business.read");

  router.get("/businessos/strategies", ({ actor, query }) => service.listStrategies(actor, query), "business.strategy.view");
  router.post("/businessos/strategies", ({ body, actor }) => service.createStrategy(body, actor), "business.strategy.create");

  router.get("/businessos/goals", ({ actor, query }) => service.listGoals(actor, query), "business.goal.view");
  router.post("/businessos/goals", ({ body, actor }) => service.createGoal(body, actor), "business.goal.create");
  router.get("/businessos/goals/:id", ({ params, actor }) => service.listGoals(actor), "business.goal.view");
  router.patch("/businessos/goals/:id", ({ params, body, actor }) => service.updateGoal(params.id, body, actor), "business.goal.update");

  router.get("/businessos/okrs", ({ actor, query }) => service.listOKRs(actor, query), "business.okr.view");
  router.post("/businessos/okrs", ({ body, actor }) => service.createOKR(body, actor), "business.okr.create");

  router.get("/businessos/initiatives", ({ actor, query }) => service.listInitiatives(actor, query), "business.initiative.view");
  router.post("/businessos/initiatives", ({ body, actor }) => service.createInitiative(body, actor), "business.initiative.create");

  router.get("/businessos/business-plans", ({ actor }) => service.listBusinessPlans(actor), "business.plan.view");
  router.post("/businessos/business-plans", ({ body, actor }) => service.createBusinessPlan(body, actor), "business.plan.create");

  router.get("/businessos/scorecards", ({ actor }) => service.listScorecards(actor), "business.scorecard.view");
  router.post("/businessos/scorecards", ({ body, actor }) => service.createScorecard(body, actor), "business.scorecard.create");

  router.get("/businessos/decisions", ({ actor, query }) => service.listDecisions(actor, query), "business.decision.view");
  router.post("/businessos/decisions", ({ body, actor }) => service.createDecision(body, actor), "business.decision.create");

  router.get("/businessos/swot-analyses", ({ actor }) => service.listSWOTAnalyses(actor), "business.swot.view");
  router.post("/businessos/swot-analyses", ({ body, actor }) => service.createSWOTAnalysis(body, actor), "business.swot.create");

  router.get("/businessos/competitors", ({ actor }) => service.listCompetitors(actor), "business.competitor.view");
  router.post("/businessos/competitors", ({ body, actor }) => service.createCompetitor(body, actor), "business.competitor.create");

  router.get("/businessos/risks", ({ actor }) => service.listRisks(actor), "business.risk.view");
  router.post("/businessos/risks", ({ body, actor }) => service.createRisk(body, actor), "business.risk.create");

  router.get("/businessos/offers", ({ actor }) => service.listOffers(actor), "business.offer.view");
  router.post("/businessos/offers", ({ body, actor }) => service.createOffer(body, actor), "business.offer.create");

  router.get("/businessos/roadmaps", ({ actor }) => service.listRoadmaps(actor), "business.roadmap.view");
  router.post("/businessos/roadmaps", ({ body, actor }) => service.createRoadmap(body, actor), "business.roadmap.create");

  router.get("/businessos/processes", ({ actor }) => service.listProcesses(actor), "business.process.view");
  router.post("/businessos/processes", ({ body, actor }) => service.createProcess(body, actor), "business.process.create");

  router.get("/businessos/sops", ({ actor }) => service.listSOPs(actor), "business.sop.view");
  router.post("/businessos/sops", ({ body, actor }) => service.createSOP(body, actor), "business.sop.create");

  router.get("/businessos/personas", ({ actor }) => service.listPersonas(actor), "business.persona.view");
  router.post("/businessos/personas", ({ body, actor }) => service.createPersona(body, actor), "business.persona.create");

  router.get("/businessos/customer-journeys", ({ actor }) => service.listCustomerJourneys(actor), "business.journey.view");
  router.post("/businessos/customer-journeys", ({ body, actor }) => service.createCustomerJourney(body, actor), "business.journey.create");

  router.get("/businessos/revenue-models", ({ actor }) => service.listRevenueModels(actor), "business.revenue.view");
  router.post("/businessos/revenue-models", ({ body, actor }) => service.createRevenueModel(body, actor), "business.revenue.create");

  router.get("/businessos/pricing-plans", ({ actor }) => service.listPricingPlans(actor), "business.pricing.view");
  router.post("/businessos/pricing-plans", ({ body, actor }) => service.createPricingPlan(body, actor), "business.pricing.create");

  router.get("/businessos/business-models", ({ actor }) => service.listBusinessModels(actor), "business.model.view");
  router.post("/businessos/business-models", ({ body, actor }) => service.createBusinessModel(body, actor), "business.model.create");

  router.get("/businessos/audit", ({ actor }) => service.listAuditLogs(actor), "business.audit.view");

  return router;
}
