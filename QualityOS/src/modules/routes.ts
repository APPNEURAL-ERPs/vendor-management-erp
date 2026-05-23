import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { QualityService } from "../service";

export function registerRoutes(router: Router, service: QualityService): Router {
  router.get("/health", () => ({ service: "QualityOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/qualityos/overview", ({ actor }) => service.overview(actor), "quality.item.read");

  router.get("/qualityos/processes", ({ actor }) => service.listProcesses(actor), "quality.process.read");
  router.post("/qualityos/processes", ({ body, actor }) => service.createProcess(body, actor), "quality.process.write");

  router.get("/qualityos/checklists", ({ actor }) => service.listChecklists(actor), "quality.checklist.read");
  router.post("/qualityos/checklists", ({ body, actor }) => service.createChecklist(body, actor), "quality.checklist.write");

  router.get("/qualityos/test-plans", ({ actor }) => service.listTestPlans(actor), "quality.test.read");
  router.post("/qualityos/test-plans", ({ body, actor }) => service.createTestPlan(body, actor), "quality.test.write");

  router.get("/qualityos/test-cases", ({ actor, query }) => service.listTestCases(actor, query), "quality.test.read");
  router.post("/qualityos/test-cases", ({ body, actor }) => service.createTestCase(body, actor), "quality.test.write");

  router.get("/qualityos/test-runs", ({ actor, query }) => service.listTestRuns(actor, query), "quality.test.read");
  router.post("/qualityos/test-runs", ({ body, actor }) => service.createTestRun(body, actor), "quality.test.write");
  router.post("/qualityos/test-runs/:testRunId/execute/:testCaseId", ({ params, body, actor }) => service.executeTestCase(params.testRunId, params.testCaseId, body, actor), "quality.test.execute");

  router.get("/qualityos/bugs", ({ actor, query }) => service.listBugs(actor, query), "quality.bug.read");
  router.post("/qualityos/bugs", ({ body, actor }) => service.createBug(body, actor), "quality.bug.write");
  router.patch("/qualityos/bugs/:bugId", ({ params, body, actor }) => service.updateBug(params.bugId, body, actor), "quality.bug.write");
  router.post("/qualityos/bugs/:bugId/comments", ({ params, body, actor }) => service.addBugComment(params.bugId, body, actor), "quality.bug.write");

  router.get("/qualityos/feedback", ({ actor, query }) => service.listFeedback(actor, query), "quality.feedback.read");
  router.post("/qualityos/feedback", ({ body, actor }) => service.createFeedback(body, actor), "quality.feedback.write");

  router.get("/qualityos/surveys", ({ actor }) => service.listSurveys(actor), "quality.feedback.read");
  router.post("/qualityos/surveys", ({ body, actor }) => service.createSurvey(body, actor), "quality.feedback.write");
  router.post("/qualityos/surveys/:surveyId/responses", ({ params, body, actor }) => service.submitSurveyResponse(params.surveyId, body, actor), "quality.feedback.write");

  router.get("/qualityos/metrics", ({ actor, query }) => service.listMetrics(actor, query), "quality.metric.read");
  router.post("/qualityos/metrics", ({ body, actor }) => service.createMetric(body, actor), "quality.metric.write");

  router.get("/qualityos/release-readiness", ({ actor }) => service.listReleaseReadiness(actor), "quality.item.read");
  router.post("/qualityos/release-readiness", ({ body, actor }) => service.createReleaseReadiness(body, actor), "quality.item.write");

  router.get("/qualityos/root-cause-analyses", ({ actor }) => service.listRootCauseAnalyses(actor), "quality.item.read");
  router.post("/qualityos/root-cause-analyses", ({ body, actor }) => service.createRootCauseAnalysis(body, actor), "quality.item.write");

  router.get("/qualityos/audit", ({ actor }) => service.listAuditLogs(actor), "quality.item.read");

  return router;
}
