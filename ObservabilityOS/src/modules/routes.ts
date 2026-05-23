import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { ObservabilityService } from "../service";

export function registerRoutes(router: Router, service: ObservabilityService): Router {
  router.get("/health", () => ({ service: "ObservabilityOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/observability/overview", ({ actor }) => service.overview(actor), "observability.dashboard.read");

  router.get("/observability/logs", ({ actor, query }) => service.listLogs(actor, query), "observability.logs.read");
  router.post("/observability/logs", ({ body, actor }) => service.createLog(body, actor), "observability.logs.write");

  router.get("/observability/metrics", ({ actor }) => service.listMetricDefinitions(actor), "observability.metrics.read");
  router.post("/observability/metrics", ({ body, actor }) => service.createMetricDefinition(body, actor), "observability.metrics.write");
  router.post("/observability/metrics/points", ({ body, actor }) => service.recordMetricPoint(body, actor), "observability.metrics.write");

  router.get("/observability/traces", ({ actor, query }) => service.listTraces(actor, query), "observability.traces.read");
  router.get("/observability/traces/:traceId", ({ params, actor }) => service.getTrace(params.traceId, actor), "observability.traces.read");
  router.post("/observability/traces", ({ body, actor }) => service.createTrace(body, actor), "observability.traces.write");

  router.get("/observability/alerts/rules", ({ actor }) => service.listAlertRules(actor), "observability.alerts.read");
  router.post("/observability/alerts/rules", ({ body, actor }) => service.createAlertRule(body, actor), "observability.alerts.write");

  router.get("/observability/alerts/events", ({ actor, query }) => service.listAlertEvents(actor, query), "observability.alerts.read");
  router.post("/observability/alerts/events", ({ body, actor }) => service.createAlertEvent(body, actor), "observability.alerts.write");
  router.post("/observability/alerts/events/:id/acknowledge", ({ params, actor }) => service.acknowledgeAlert(params.id, actor), "observability.alerts.write");
  router.post("/observability/alerts/events/:id/resolve", ({ params, actor }) => service.resolveAlert(params.id, actor), "observability.alerts.write");

  router.get("/observability/health", ({ actor }) => service.listHealthChecks(actor), "observability.health.read");
  router.post("/observability/health", ({ body, actor }) => service.createHealthCheck(body, actor), "observability.health.write");

  router.get("/observability/services", ({ actor, query }) => service.listServiceMetrics(actor, query), "observability.health.read");
  router.post("/observability/services", ({ body, actor }) => service.createServiceMetrics(body, actor), "observability.health.write");

  router.get("/observability/slos", ({ actor }) => service.listSLOs(actor), "observability.slo.read");
  router.post("/observability/slos", ({ body, actor }) => service.createSLO(body, actor), "observability.slo.write");

  router.get("/observability/incidents", ({ actor, query }) => service.listIncidents(actor, query), "observability.incident.read");
  router.post("/observability/incidents", ({ body, actor }) => service.createIncident(body, actor), "observability.incident.write");
  router.patch("/observability/incidents/:id", ({ params, body, actor }) => service.updateIncidentStatus(params.id, body, actor), "observability.incident.write");

  router.get("/observability/dashboards", ({ actor }) => service.listDashboards(actor), "observability.dashboard.read");
  router.post("/observability/dashboards", ({ body, actor }) => service.createDashboard(body, actor), "observability.dashboard.write");

  router.get("/observability/costs", ({ actor, query }) => service.listCostMetrics(actor, query), "observability.cost.read");
  router.post("/observability/costs", ({ body, actor }) => service.recordCostMetric(body, actor), "observability.cost.write");

  router.get("/observability/errors", ({ actor, query }) => service.listErrorEvents(actor, query), "observability.alerts.read");
  router.post("/observability/errors", ({ body, actor }) => service.createErrorEvent(body, actor), "observability.alerts.write");

  router.get("/observability/audit", ({ actor }) => service.listAuditLogs(actor), "observability.audit.read");
  router.get("/observability/events", ({ actor }) => service.listEvents(actor), "observability.dashboard.read");

  return router;
}
