import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { AnalyticsService } from "../service";

export function registerRoutes(router: Router, service: AnalyticsService): Router {
  router.get("/health", () => ({ service: "AnalyticsOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/analyticsos/overview", ({ actor }) => service.overview(actor), "analytics.overview.view");

  router.get("/analyticsos/dashboards", ({ actor, query }) => service.listDashboards(actor, query), "analytics.dashboard.read");
  router.post("/analyticsos/dashboards", ({ body, actor }) => service.createDashboard(body, actor), "analytics.dashboard.write");
  router.get("/analyticsos/dashboards/:id", ({ params, actor }) => service.getDashboard(params.id, actor), "analytics.dashboard.read");
  router.patch("/analyticsos/dashboards/:id", ({ params, body, actor }) => service.updateDashboard(params.id, body, actor), "analytics.dashboard.write");
  router.post("/analyticsos/dashboards/:id/widgets", ({ params, body, actor }) => service.addDashboardWidget(params.id, body, actor), "analytics.dashboard.write");

  router.get("/analyticsos/kpis", ({ actor, query }) => service.listKPIs(actor, query), "analytics.kpi.read");
  router.post("/analyticsos/kpis", ({ body, actor }) => service.createKPI(body, actor), "analytics.kpi.write");
  router.get("/analyticsos/kpis/:id", ({ params, actor }) => service.getKPI(params.id, actor), "analytics.kpi.read");
  router.patch("/analyticsos/kpis/:id", ({ params, body, actor }) => service.updateKPI(params.id, body, actor), "analytics.kpi.write");

  router.get("/analyticsos/metrics", ({ actor }) => service.listMetrics(actor), "analytics.metric.read");
  router.post("/analyticsos/metrics", ({ body, actor }) => service.createMetric(body, actor), "analytics.metric.write");

  router.get("/analyticsos/reports", ({ actor }) => service.listReports(actor), "analytics.report.read");
  router.post("/analyticsos/reports", ({ body, actor }) => service.createReport(body, actor), "analytics.report.write");

  router.post("/analyticsos/events", ({ body, actor }) => service.trackEvent(body, actor), "analytics.event.write");
  router.get("/analyticsos/events", ({ actor, query }) => service.listEvents(actor, query), "analytics.event.read");

  router.get("/analyticsos/funnels", ({ actor }) => service.listFunnels(actor), "analytics.funnel.read");
  router.post("/analyticsos/funnels", ({ body, actor }) => service.createFunnel(body, actor), "analytics.funnel.write");
  router.get("/analyticsos/funnels/:id", ({ params, actor }) => service.getFunnel(params.id, actor), "analytics.funnel.read");

  router.get("/analyticsos/cohorts", ({ actor }) => service.listCohorts(actor), "analytics.cohort.read");
  router.post("/analyticsos/cohorts", ({ body, actor }) => service.createCohort(body, actor), "analytics.cohort.write");

  router.get("/analyticsos/segments", ({ actor }) => service.listSegments(actor), "analytics.segment.read");
  router.post("/analyticsos/segments", ({ body, actor }) => service.createSegment(body, actor), "analytics.segment.write");

  router.get("/analyticsos/alerts/rules", ({ actor }) => service.listAlertRules(actor), "analytics.alert.read");
  router.post("/analyticsos/alerts/rules", ({ body, actor }) => service.createAlertRule(body, actor), "analytics.alert.write");
  router.get("/analyticsos/alerts", ({ actor }) => service.listAlerts(actor), "analytics.alert.read");
  router.patch("/analyticsos/alerts/:id/acknowledge", ({ params, actor }) => service.acknowledgeAlert(params.id, actor), "analytics.alert.write");
  router.patch("/analyticsos/alerts/:id/resolve", ({ params, actor }) => service.resolveAlert(params.id, actor), "analytics.alert.write");

  router.get("/analyticsos/goals", ({ actor }) => service.listGoals(actor), "analytics.goal.read");
  router.post("/analyticsos/goals", ({ body, actor }) => service.createGoal(body, actor), "analytics.goal.write");

  router.get("/analyticsos/forecasts", ({ actor }) => service.listForecasts(actor), "analytics.forecast.read");
  router.post("/analyticsos/forecasts", ({ body, actor }) => service.createForecast(body, actor), "analytics.forecast.write");

  router.get("/analyticsos/insights", ({ actor, query }) => service.listInsights(actor, query), "analytics.insight.read");

  router.get("/analyticsos/audit", ({ actor }) => service.listAuditLogs(actor), "analytics.audit.read");

  return router;
}
