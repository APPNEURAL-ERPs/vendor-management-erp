import { Router } from "./core/http";
import { ExperimentosService } from "./service";
import { docs } from "./docs";

export function registerRoutes(router: Router, service: ExperimentosService): Router {
  router.get("/health", () => ({ service: "ExperimentOS", status: "ok", message: "ExperimentOS is running" }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

  router.get("/experimentos/overview", ({ actor }) => service.overview(actor), "experiment.overview.view");

  router.get("/experimentos/experiments", ({ actor, query }) => service.listExperiments(actor, query), "experiment.read");
  router.post("/experimentos/experiments", ({ body, actor }) => service.createExperiment(body, actor), "experiment.write");
  router.get("/experimentos/experiments/:id", ({ params, actor }) => service.getExperiment(params.id, actor), "experiment.read");
  router.patch("/experimentos/experiments/:id", ({ params, body, actor }) => service.updateExperiment(params.id, body, actor), "experiment.write");
  router.post("/experimentos/experiments/:id/start", ({ params, actor }) => service.startExperiment(params.id, actor), "experiment.run");
  router.post("/experimentos/experiments/:id/pause", ({ params, actor }) => service.pauseExperiment(params.id, actor), "experiment.run");
  router.post("/experimentos/experiments/:id/stop", ({ params, actor }) => service.stopExperiment(params.id, actor), "experiment.run");
  router.post("/experimentos/experiments/:id/complete", ({ params, actor }) => service.completeExperiment(params.id, actor), "experiment.run");
  router.get("/experimentos/experiments/:id/analytics", ({ params, actor }) => service.getExperimentAnalytics(params.id, actor), "experiment.read");

  router.get("/experimentos/experiments/:experimentId/variants", ({ params, actor }) => service.listVariants(params.experimentId, actor), "experiment.read");
  router.post("/experimentos/experiments/:experimentId/variants", ({ params, body, actor }) => service.createVariant(params.experimentId, body, actor), "experiment.write");
  router.patch("/experimentos/variants/:id", ({ params, body, actor }) => service.updateVariant(params.id, body, actor), "experiment.write");

  router.post("/experimentos/experiments/:experimentId/assign", ({ params, body, actor }) => service.assignVariant(params.experimentId, body.userId, actor), "experiment.run");
  router.post("/experimentos/experiments/:experimentId/observations", ({ params, body, actor }) => service.recordObservation(params.experimentId, body, actor), "experiment.write");
  router.post("/experimentos/experiments/:experimentId/convert", ({ params, body, actor }) => service.recordConversion(params.experimentId, body.userId, body.metricId, body.value, actor), "experiment.write");

  router.post("/experimentos/experiments/:experimentId/analyze", ({ params, body, actor }) => service.analyzeExperiment(params.experimentId, body, actor), "experiment.write");

  router.get("/experimentos/hypotheses", ({ actor }) => service.listHypotheses(actor), "experiment.read");
  router.post("/experimentos/hypotheses", ({ body, actor }) => service.createHypothesis(body, actor), "experiment.write");

  router.get("/experimentos/metrics", ({ actor }) => service.listMetricDefinitions(actor), "experiment.read");
  router.post("/experimentos/metrics", ({ body, actor }) => service.createMetricDefinition(body, actor), "experiment.write");

  router.get("/experimentos/feature-flags", ({ actor }) => service.listFeatureFlags(actor), "experiment.read");
  router.post("/experimentos/feature-flags", ({ body, actor }) => service.createFeatureFlag(body, actor), "experiment.write");
  router.post("/experimentos/feature-flags/:id/toggle", ({ params, actor }) => service.toggleFeatureFlag(params.id, actor), "experiment.write");

  router.get("/experimentos/decisions", ({ actor }) => service.listDecisions(actor), "experiment.read");
  router.post("/experimentos/experiments/:experimentId/decisions", ({ params, body, actor }) => service.createDecision(params.experimentId, body, actor), "experiment.write");
  router.post("/experimentos/decisions/:id/approve", ({ params, actor }) => service.approveDecision(params.id, actor), "experiment.write");

  router.get("/experimentos/audit", ({ actor }) => service.listAuditLogs(actor), "experiment.audit.read");

  return router;
}
