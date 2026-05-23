import { Router } from "./core/http";
import { docs } from "./docs";
import { AIResourceService } from "./service";

const q = (query: any) => Object.fromEntries(query.entries());

export function registerRoutes(router: Router, service: AIResourceService): Router {
  router.get("/health", () => ({ status: "ok", os: "AIResourceOS" }));
  router.get("/docs", () => ({ ...docs, routes: router.listRoutes() }));

  router.get("/airesourceos/overview", ({ actor }) => service.overview(actor), "airesource.analytics.read");

  router.get("/airesourceos/models", ({ actor, query }) => service.listModels(actor, q(query)), "airesource.model.read");
  router.post("/airesourceos/models", ({ actor, body }) => service.createModel(actor, body), "airesource.model.write");
  router.get("/airesourceos/models/:id", ({ actor, params }) => service.getModel(actor, params.id), "airesource.model.read");
  router.put("/airesourceos/models/:id", ({ actor, params, body }) => service.updateModel(actor, params.id, body), "airesource.model.write");

  router.get("/airesourceos/budgets", ({ actor, query }) => service.listBudgets(actor, q(query)), "airesource.budget.read");
  router.post("/airesourceos/budgets", ({ actor, body }) => service.createBudget(actor, body), "airesource.budget.write");
  router.get("/airesourceos/budgets/:id", ({ actor, params }) => service.getBudget(actor, params.id), "airesource.budget.read");
  router.put("/airesourceos/budgets/:id", ({ actor, params, body }) => service.updateBudget(actor, params.id, body), "airesource.budget.write");

  router.get("/airesourceos/usage", ({ actor, query }) => service.listUsage(actor, q(query)), "airesource.usage.read");
  router.post("/airesourceos/usage", ({ actor, body }) => service.trackUsage(actor, body), "airesource.usage.write");

  router.get("/airesourceos/configs", ({ actor, query }) => service.listConfigs(actor, q(query)), "airesource.model.read");
  router.post("/airesourceos/configs", ({ actor, body }) => service.createConfig(actor, body), "airesource.model.write");
  router.get("/airesourceos/configs/:id", ({ actor, params }) => service.getConfig(actor, params.id), "airesource.model.read");
  router.put("/airesourceos/configs/:id", ({ actor, params, body }) => service.updateConfig(actor, params.id, body), "airesource.model.write");

  router.get("/airesourceos/allocations", ({ actor, query }) => service.listAllocations(actor, q(query)), "airesource.budget.read");
  router.post("/airesourceos/allocations", ({ actor, body }) => service.createAllocation(actor, body), "airesource.budget.write");
  router.get("/airesourceos/allocations/:id", ({ actor, params }) => service.getAllocation(actor, params.id), "airesource.budget.read");
  router.put("/airesourceos/allocations/:id", ({ actor, params, body }) => service.updateAllocation(actor, params.id, body), "airesource.budget.write");

  router.get("/airesourceos/quotas", ({ actor, query }) => service.listQuotas(actor, q(query)), "airesource.budget.read");
  router.post("/airesourceos/quotas", ({ actor, body }) => service.createQuota(actor, body), "airesource.budget.write");
  router.get("/airesourceos/quotas/:id", ({ actor, params }) => service.getQuota(actor, params.id), "airesource.budget.read");
  router.put("/airesourceos/quotas/:id", ({ actor, params, body }) => service.updateQuota(actor, params.id, body), "airesource.budget.write");
  router.post("/airesourceos/quotas/check", ({ actor, body }) => service.checkQuota(actor, body), "airesource.budget.read");

  router.get("/airesourceos/events", ({ actor }) => service.eventsLog(actor), "airesource.analytics.read");
  router.get("/airesourceos/audit-logs", ({ actor }) => service.auditLogs(actor), "airesource.analytics.read");

  return router;
}
