import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { AnalyticsService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";

const port = Number(process.env.PORT ?? 7400);
const dbFile = process.env.ANALYTICSOS_DB_FILE ?? "data/analyticsos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().dashboards.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new AnalyticsService(store);
const router = new Router();

router.get("/health", async () => {
  return { status: "ok", service: "AnalyticsOS", version: "1.0.0" };
});

router.get("/docs", async () => {
  return docs();
});

router.get("/analyticsos", async (ctx) => {
  return service.getOverview(ctx.actor.tenantId);
});

router.get("/analyticsos/dashboards", async (ctx) => {
  return service.listDashboards(ctx.actor.tenantId);
});

router.post("/analyticsos/dashboards", async (ctx) => {
  return service.createDashboard(ctx.actor, ctx.body);
});

router.get("/analyticsos/dashboards/:id", async (ctx) => {
  return service.getDashboard(ctx.actor, ctx.params.id);
});

router.patch("/analyticsos/dashboards/:id", async (ctx) => {
  return service.updateDashboard(ctx.actor, ctx.params.id, ctx.body);
});

router.delete("/analyticsos/dashboards/:id", async (ctx) => {
  return service.deleteDashboard(ctx.actor, ctx.params.id);
});

router.get("/analyticsos/dashboards/:id/widgets", async (ctx) => {
  return service.listWidgets(ctx.params.id);
});

router.post("/analyticsos/widgets", async (ctx) => {
  return service.createWidget(ctx.actor, ctx.body);
});

router.patch("/analyticsos/widgets/:id", async (ctx) => {
  return service.updateWidget(ctx.actor, ctx.params.id, ctx.body);
});

router.delete("/analyticsos/widgets/:id", async (ctx) => {
  return service.deleteWidget(ctx.actor, ctx.params.id);
});

router.get("/analyticsos/kpis", async (ctx) => {
  return service.listKPIs(ctx.actor.tenantId);
});

router.post("/analyticsos/kpis", async (ctx) => {
  return service.createKPI(ctx.actor, ctx.body);
});

router.get("/analyticsos/kpis/:id", async (ctx) => {
  return service.getKPI(ctx.actor, ctx.params.id);
});

router.patch("/analyticsos/kpis/:id", async (ctx) => {
  return service.updateKPI(ctx.actor, ctx.params.id, ctx.body);
});

router.delete("/analyticsos/kpis/:id", async (ctx) => {
  return service.deleteKPI(ctx.actor, ctx.params.id);
});

router.get("/analyticsos/metrics", async (ctx) => {
  return service.listMetrics(ctx.actor.tenantId);
});

router.post("/analyticsos/metrics", async (ctx) => {
  return service.createMetric(ctx.actor, ctx.body);
});

router.get("/analyticsos/metrics/:id", async (ctx) => {
  return service.getMetric(ctx.actor, ctx.params.id);
});

router.patch("/analyticsos/metrics/:id", async (ctx) => {
  return service.updateMetric(ctx.actor, ctx.params.id, ctx.body);
});

router.delete("/analyticsos/metrics/:id", async (ctx) => {
  return service.deleteMetric(ctx.actor, ctx.params.id);
});

router.get("/analyticsos/reports", async (ctx) => {
  return service.listReports(ctx.actor.tenantId);
});

router.post("/analyticsos/reports", async (ctx) => {
  return service.createReport(ctx.actor, ctx.body);
});

router.get("/analyticsos/reports/:id", async (ctx) => {
  return service.getReport(ctx.actor, ctx.params.id);
});

router.patch("/analyticsos/reports/:id", async (ctx) => {
  return service.updateReport(ctx.actor, ctx.params.id, ctx.body);
});

router.delete("/analyticsos/reports/:id", async (ctx) => {
  return service.deleteReport(ctx.actor, ctx.params.id);
});

router.post("/analyticsos/events", async (ctx) => {
  return service.trackEvent(ctx.actor, ctx.body);
});

router.get("/analyticsos/events", async (ctx) => {
  const limit = Number(ctx.query.get("limit") ?? 100);
  return service.listEvents(ctx.actor.tenantId, limit);
});

router.get("/analyticsos/funnels", async (ctx) => {
  return service.listFunnels(ctx.actor.tenantId);
});

router.post("/analyticsos/funnels", async (ctx) => {
  return service.createFunnel(ctx.actor, ctx.body);
});

router.get("/analyticsos/funnels/:id", async (ctx) => {
  return service.getFunnel(ctx.actor, ctx.params.id);
});

router.post("/analyticsos/funnels/:id/analyze", async (ctx) => {
  return service.analyzeFunnel(ctx.params.id, ctx.body);
});

router.patch("/analyticsos/funnels/:id", async (ctx) => {
  return service.updateFunnel(ctx.actor, ctx.params.id, ctx.body);
});

router.delete("/analyticsos/funnels/:id", async (ctx) => {
  return service.deleteFunnel(ctx.actor, ctx.params.id);
});

router.get("/analyticsos/cohorts", async (ctx) => {
  return service.listCohorts(ctx.actor.tenantId);
});

router.post("/analyticsos/cohorts", async (ctx) => {
  return service.createCohort(ctx.actor, ctx.body);
});

router.get("/analyticsos/cohorts/:id", async (ctx) => {
  return service.getCohort(ctx.actor, ctx.params.id);
});

router.post("/analyticsos/cohorts/:id/analyze", async (ctx) => {
  return service.analyzeCohort(ctx.params.id, ctx.body);
});

router.patch("/analyticsos/cohorts/:id", async (ctx) => {
  return service.updateCohort(ctx.actor, ctx.params.id, ctx.body);
});

router.delete("/analyticsos/cohorts/:id", async (ctx) => {
  return service.deleteCohort(ctx.actor, ctx.params.id);
});

router.get("/analyticsos/segments", async (ctx) => {
  return service.listSegments(ctx.actor.tenantId);
});

router.post("/analyticsos/segments", async (ctx) => {
  return service.createSegment(ctx.actor, ctx.body);
});

router.get("/analyticsos/segments/:id", async (ctx) => {
  return service.getSegment(ctx.actor, ctx.params.id);
});

router.patch("/analyticsos/segments/:id", async (ctx) => {
  return service.updateSegment(ctx.actor, ctx.params.id, ctx.body);
});

router.delete("/analyticsos/segments/:id", async (ctx) => {
  return service.deleteSegment(ctx.actor, ctx.params.id);
});

router.get("/analyticsos/alerts", async (ctx) => {
  return service.listAlerts(ctx.actor.tenantId);
});

router.post("/analyticsos/alerts", async (ctx) => {
  return service.createAlert(ctx.actor, ctx.body);
});

router.get("/analyticsos/alerts/:id", async (ctx) => {
  return service.getAlert(ctx.actor, ctx.params.id);
});

router.patch("/analyticsos/alerts/:id", async (ctx) => {
  return service.updateAlert(ctx.actor, ctx.params.id, ctx.body);
});

router.delete("/analyticsos/alerts/:id", async (ctx) => {
  return service.deleteAlert(ctx.actor, ctx.params.id);
});

router.get("/analyticsos/forecasts", async (ctx) => {
  return service.listForecasts(ctx.actor.tenantId);
});

router.post("/analyticsos/forecasts", async (ctx) => {
  return service.createForecast(ctx.actor, ctx.body);
});

router.get("/analyticsos/forecasts/:id", async (ctx) => {
  return service.getForecast(ctx.actor, ctx.params.id);
});

router.get("/analyticsos/attribution", async (ctx) => {
  return service.listAttributionModels(ctx.actor.tenantId);
});

router.post("/analyticsos/attribution", async (ctx) => {
  return service.createAttributionModel(ctx.actor, ctx.body);
});

router.get("/analyticsos/data-sources", async (ctx) => {
  return service.listDataSources(ctx.actor.tenantId);
});

router.post("/analyticsos/data-sources", async (ctx) => {
  return service.createDataSource(ctx.actor, ctx.body);
});

router.get("/analyticsos/insights", async (ctx) => {
  return service.listInsights(ctx.actor.tenantId);
});

router.get("/analyticsos/audit-logs", async (ctx) => {
  const limit = Number(ctx.query.get("limit") ?? 50);
  return service.listAuditLogs(ctx.actor.tenantId, limit);
});

router.post("/analyticsos/query", async (ctx) => {
  return service.query(ctx.body);
});

router.post("/analyticsos/export", async (ctx) => {
  return service.exportData(ctx.actor, ctx.body);
});

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`AnalyticsOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
