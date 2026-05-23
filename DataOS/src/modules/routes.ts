import { Router, sendJson } from "../core/http";
import { DataosService } from "../service";
import { docs } from "../docs";
import { HttpContext } from "../core/http";

export function registerRoutes(router: Router, service: DataosService): Router {
  router.get("/dataos", (ctx) => {
    return { name: "DataOS", version: "1.0.0", status: "running" };
  });

  router.get("/health", () => {
    return { status: "healthy", timestamp: new Date().toISOString() };
  });

  router.get("/docs", () => docs());

  router.get("/dataos/overview", (ctx) => {
    return service.getOverview(ctx.actor.tenantId);
  });

  router.get("/dataos/models", (ctx) => {
    return service.listModels(ctx.actor.tenantId);
  });

  router.get("/dataos/models/:id", (ctx) => {
    return service.getModel(ctx.actor.tenantId, ctx.params.id);
  });

  router.post("/dataos/models", (ctx) => {
    return service.createModel(ctx.actor, ctx.body);
  });

  router.patch("/dataos/models/:id", (ctx) => {
    return service.updateModel(ctx.actor, ctx.params.id, ctx.body);
  });

  router.delete("/dataos/models/:id", (ctx) => {
    return service.deleteModel(ctx.actor, ctx.params.id);
  });

  router.get("/dataos/schemas", (ctx) => {
    return service.listSchemas(ctx.actor.tenantId);
  });

  router.get("/dataos/schemas/:id", (ctx) => {
    return service.getSchema(ctx.actor.tenantId, ctx.params.id);
  });

  router.post("/dataos/schemas", (ctx) => {
    return service.createSchema(ctx.actor, ctx.body);
  });

  router.get("/dataos/datasets", (ctx) => {
    return service.listDatasets(ctx.actor.tenantId);
  });

  router.get("/dataos/datasets/:id", (ctx) => {
    return service.getDataset(ctx.actor.tenantId, ctx.params.id);
  });

  router.post("/dataos/datasets", (ctx) => {
    return service.createDataset(ctx.actor, ctx.body);
  });

  router.get("/dataos/sources", (ctx) => {
    return service.listSources(ctx.actor.tenantId);
  });

  router.get("/dataos/sources/:id", (ctx) => {
    return service.getSource(ctx.actor.tenantId, ctx.params.id);
  });

  router.post("/dataos/sources", (ctx) => {
    return service.createSource(ctx.actor, ctx.body);
  });

  router.get("/dataos/pipelines", (ctx) => {
    return service.listPipelines(ctx.actor.tenantId);
  });

  router.get("/dataos/pipelines/:id", (ctx) => {
    return service.getPipeline(ctx.actor.tenantId, ctx.params.id);
  });

  router.post("/dataos/pipelines", (ctx) => {
    return service.createPipeline(ctx.actor, ctx.body);
  });

  router.get("/dataos/catalog", (ctx) => {
    return service.listCatalog(ctx.actor.tenantId);
  });

  router.get("/dataos/catalog/:id", (ctx) => {
    return service.getCatalogItem(ctx.actor.tenantId, ctx.params.id);
  });

  router.post("/dataos/catalog", (ctx) => {
    return service.createCatalogItem(ctx.actor, ctx.body);
  });

  router.get("/dataos/quality/checks", (ctx) => {
    return service.listQualityChecks(ctx.actor.tenantId);
  });

  router.post("/dataos/quality/checks", (ctx) => {
    return service.createQualityCheck(ctx.actor, ctx.body);
  });

  router.get("/dataos/lineage", (ctx) => {
    return service.listLineages(ctx.actor.tenantId);
  });

  router.post("/dataos/lineage", (ctx) => {
    return service.createLineage(ctx.actor, ctx.body);
  });

  router.get("/dataos/products", (ctx) => {
    return service.listProducts(ctx.actor.tenantId);
  });

  router.get("/dataos/products/:id", (ctx) => {
    return service.getProduct(ctx.actor.tenantId, ctx.params.id);
  });

  router.post("/dataos/products", (ctx) => {
    return service.createProduct(ctx.actor, ctx.body);
  });

  router.get("/dataos/events", (ctx) => {
    return service.getEvents(ctx.actor.tenantId);
  });

  router.post("/dataos/events", (ctx) => {
    return service.emitEvent(ctx.actor, ctx.body.type, ctx.body.data);
  });

  router.get("/dataos/audit", (ctx) => {
    const limit = parseInt(ctx.query.get("limit") ?? "100");
    return service.getAuditLogs(ctx.actor.tenantId, limit);
  });

  return router;
}
