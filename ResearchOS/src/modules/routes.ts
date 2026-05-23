import { Router } from "../core/http";
import { ResearchService } from "../service";
import { DataStore } from "../core/datastore";

export function registerRoutes(router: Router, service: ResearchService): Router {
  router.get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }));
  router.get("/docs", () => import("../docs").then(m => m.docs()));

  router.get("/researchos", (ctx) => service.getOverview(ctx.actor));

  router.get("/researchos/studies", (ctx) => service.listStudies(ctx.actor));
  router.post("/researchos/studies", (ctx) => service.createStudy(ctx.actor, ctx.body), "research.study.write");
  router.get("/researchos/studies/:id", (ctx) => service.getStudy(ctx.actor, ctx.params.id));
  router.patch("/researchos/studies/:id", (ctx) => service.updateStudy(ctx.actor, ctx.params.id, ctx.body), "research.study.write");

  router.get("/researchos/questions", (ctx) => service.listQuestions(ctx.actor, ctx.query.get("studyId") ?? undefined));
  router.post("/researchos/questions", (ctx) => service.createQuestion(ctx.actor, ctx.body), "research.question.write");
  router.get("/researchos/questions/:id", (ctx) => service.getQuestion(ctx.actor, ctx.params.id));
  router.patch("/researchos/questions/:id", (ctx) => service.updateQuestion(ctx.actor, ctx.params.id, ctx.body), "research.question.write");

  router.get("/researchos/sources", (ctx) => service.listSources(ctx.actor, ctx.query.get("studyId") ?? undefined));
  router.post("/researchos/sources", (ctx) => service.createSource(ctx.actor, ctx.body), "research.source.write");
  router.get("/researchos/sources/:id", (ctx) => service.getSource(ctx.actor, ctx.params.id));
  router.patch("/researchos/sources/:id", (ctx) => service.updateSource(ctx.actor, ctx.params.id, ctx.body), "research.source.write");

  router.get("/researchos/notes", (ctx) => service.listNotes(ctx.actor, ctx.query.get("studyId") ?? undefined));
  router.post("/researchos/notes", (ctx) => service.createNote(ctx.actor, ctx.body), "research.note.write");

  router.get("/researchos/hypotheses", (ctx) => service.listHypotheses(ctx.actor, ctx.query.get("questionId") ?? undefined));
  router.post("/researchos/hypotheses", (ctx) => service.createHypothesis(ctx.actor, ctx.body), "research.hypothesis.write");

  router.get("/researchos/evidence", (ctx) => service.listEvidence(ctx.actor, ctx.query.get("sourceId") ?? undefined));
  router.post("/researchos/evidence", (ctx) => service.createEvidence(ctx.actor, ctx.body), "research.evidence.write");

  router.get("/researchos/insights", (ctx) => service.listInsights(ctx.actor, ctx.query.get("studyId") ?? undefined));
  router.post("/researchos/insights", (ctx) => service.createInsight(ctx.actor, ctx.body), "research.insight.write");
  router.get("/researchos/insights/:id", (ctx) => service.getInsight(ctx.actor, ctx.params.id));
  router.patch("/researchos/insights/:id", (ctx) => service.updateInsight(ctx.actor, ctx.params.id, ctx.body), "research.insight.write");

  router.get("/researchos/competitors", (ctx) => service.listCompetitors(ctx.actor, ctx.query.get("studyId") ?? undefined));
  router.post("/researchos/competitors", (ctx) => service.createCompetitor(ctx.actor, ctx.body), "research.competitor.write");

  router.get("/researchos/interviews", (ctx) => service.listInterviews(ctx.actor, ctx.query.get("studyId") ?? undefined));
  router.post("/researchos/interviews", (ctx) => service.createInterview(ctx.actor, ctx.body), "research.interview.write");

  router.get("/researchos/surveys", (ctx) => service.listSurveys(ctx.actor, ctx.query.get("studyId") ?? undefined));
  router.post("/researchos/surveys", (ctx) => service.createSurvey(ctx.actor, ctx.body), "research.survey.write");

  router.get("/researchos/painpoints", (ctx) => service.listPainPoints(ctx.actor, ctx.query.get("studyId") ?? undefined));
  router.post("/researchos/painpoints", (ctx) => service.createPainPoint(ctx.actor, ctx.body), "research.painpoint.write");

  router.get("/researchos/segments", (ctx) => service.listMarketSegments(ctx.actor, ctx.query.get("studyId") ?? undefined));
  router.post("/researchos/segments", (ctx) => service.createMarketSegment(ctx.actor, ctx.body), "research.segment.write");

  router.get("/researchos/reports", (ctx) => service.listReports(ctx.actor, ctx.query.get("studyId") ?? undefined));
  router.post("/researchos/reports", (ctx) => service.createReport(ctx.actor, ctx.body), "research.report.write");

  return router;
}
