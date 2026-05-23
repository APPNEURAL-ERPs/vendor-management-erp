import { Router } from "../core/http";
import { SalesService } from "../service";

export function registerRoutes(router: Router, service: SalesService): Router {
  router.get("/health", () => ({ service: "SalesOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ name: "SalesOS", version: "1.0.0", description: "SalesOS: leads, pipeline, deals, proposals, follow-ups, and revenue management" }));
  router.get("/permissions", () => ({ role: "viewer", permissions: ["sales.read"] }));

  router.get("/salesos/overview", ({ actor }) => service.overview(actor), "sales.analytics.read");

  router.get("/salesos/leads", ({ actor, query }) => service.listLeads(actor, query), "sales.lead.read");
  router.post("/salesos/leads", ({ body, actor }) => service.createLead(body, actor), "sales.lead.write");
  router.get("/salesos/leads/:id", ({ params, actor }) => service.getLead(params.id, actor), "sales.lead.read");
  router.patch("/salesos/leads/:id", ({ params, body, actor }) => service.updateLead(params.id, body, actor), "sales.lead.write");

  router.get("/salesos/contacts", ({ actor, query }) => service.listContacts(actor, query), "sales.lead.read");
  router.post("/salesos/contacts", ({ body, actor }) => service.createContact(body, actor), "sales.lead.write");
  router.get("/salesos/contacts/:id", ({ params, actor }) => service.getContact(params.id, actor), "sales.lead.read");

  router.get("/salesos/accounts", ({ actor, query }) => service.listAccounts(actor, query), "sales.deal.read");
  router.post("/salesos/accounts", ({ body, actor }) => service.createAccount(body, actor), "sales.deal.write");
  router.get("/salesos/accounts/:id", ({ params, actor }) => service.getAccount(params.id, actor), "sales.deal.read");

  router.get("/salesos/deals", ({ actor, query }) => service.listDeals(actor, query), "sales.deal.read");
  router.post("/salesos/deals", ({ body, actor }) => service.createDeal(body, actor), "sales.deal.write");
  router.get("/salesos/deals/:id", ({ params, actor }) => service.getDeal(params.id, actor), "sales.deal.read");
  router.patch("/salesos/deals/:id", ({ params, body, actor }) => service.updateDeal(params.id, body, actor), "sales.deal.write");

  router.get("/salesos/pipelines", ({ actor }) => service.listPipelines(actor), "sales.pipeline.manage");
  router.post("/salesos/pipelines", ({ body, actor }) => service.createPipeline(body, actor), "sales.pipeline.manage");

  router.get("/salesos/activities", ({ actor, query }) => service.listActivities(actor, query), "sales.lead.read");
  router.post("/salesos/activities", ({ body, actor }) => service.createActivity(body, actor), "sales.lead.write");

  router.get("/salesos/follow-ups", ({ actor, query }) => service.listFollowUps(actor, query), "sales.lead.read");
  router.post("/salesos/follow-ups", ({ body, actor }) => service.createFollowUp(body, actor), "sales.lead.write");
  router.patch("/salesos/follow-ups/:id", ({ params, body, actor }) => service.updateFollowUp(params.id, body, actor), "sales.lead.write");

  router.get("/salesos/proposals", ({ actor, query }) => service.listProposals(actor, query), "sales.proposal.read");
  router.post("/salesos/proposals", ({ body, actor }) => service.createProposal(body, actor), "sales.proposal.write");
  router.get("/salesos/proposals/:id", ({ params, actor }) => service.getProposal(params.id, actor), "sales.proposal.read");
  router.patch("/salesos/proposals/:id", ({ params, body, actor }) => service.updateProposal(params.id, body, actor), "sales.proposal.write");

  router.get("/salesos/targets", ({ actor }) => service.listTargets(actor), "sales.forecast.read");
  router.post("/salesos/targets", ({ body, actor }) => service.createTarget(body, actor), "sales.forecast.read");

  router.get("/salesos/forecasts", ({ actor }) => service.listForecasts(actor), "sales.forecast.read");
  router.post("/salesos/forecasts", ({ body, actor }) => service.createForecast(body, actor), "sales.forecast.read");

  router.get("/salesos/audit", ({ actor }) => service.listAuditLogs(actor), "sales.analytics.read");

  return router;
}
