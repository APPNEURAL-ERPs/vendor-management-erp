import { Router } from "../core/http";
import { LearningService } from "../service";
import { docs } from "../docs";

export function registerRoutes(router: Router, service: LearningService): Router {
  router.get("/health", () => ({ service: "LearningOS", status: "ok", message: "LearningOS is running" }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

  router.get("/learning/overview", ({ actor }) => service.getOverview(actor));

  router.get("/learning/courses", ({ actor, query }) => service.listCourses(actor, query));
  router.post("/learning/courses", ({ body, actor }) => service.createCourse(body, actor));
  router.get("/learning/courses/:id", ({ params, actor }) => service.getCourse(params.id, actor));
  router.patch("/learning/courses/:id", ({ params, body, actor }) => service.updateCourse(params.id, body, actor));

  router.get("/learning/lessons", ({ actor, query }) => service.listLessons(actor, query));
  router.post("/learning/lessons", ({ body, actor }) => service.createLesson(body, actor));

  router.get("/learning/enrollments", ({ actor, query }) => service.listEnrollments(actor, query));
  router.post("/learning/enrollments", ({ body, actor }) => service.createEnrollment(body, actor));
  router.patch("/learning/enrollments/:id/progress", ({ params, body, actor }) => {
    const progress = body.progress ?? body;
    return service.updateEnrollmentProgress(params.id, typeof progress === 'number' ? progress : progress.progress, actor);
  });

  router.get("/learning/learners", ({ actor, query }) => service.listLearners(actor, query));
  router.post("/learning/learners", ({ body, actor }) => service.createLearner(body, actor));

  router.get("/learning/trainers", ({ actor }) => service.listTrainers(actor));
  router.post("/learning/trainers", ({ body, actor }) => service.createTrainer(body, actor));

  router.get("/learning/batches", ({ actor, query }) => service.listBatches(actor, query));
  router.post("/learning/batches", ({ body, actor }) => service.createBatch(body, actor));

  router.get("/learning/assessments", ({ actor, query }) => service.listAssessments(actor, query));
  router.post("/learning/assessments", ({ body, actor }) => service.createAssessment(body, actor));

  router.get("/learning/certificates", ({ actor, query }) => service.listCertificates(actor, query));
  router.post("/learning/certificates/generate", ({ body, actor }) => service.generateCertificate(body, actor));

  router.get("/learning/learning-paths", ({ actor }) => service.listLearningPaths(actor));
  router.post("/learning/learning-paths", ({ body, actor }) => service.createLearningPath(body, actor));

  router.get("/learning/skills", ({ actor }) => service.listSkills(actor));
  router.post("/learning/skills", ({ body, actor }) => service.createSkill(body, actor));

  router.get("/learning/badges", ({ actor }) => service.listBadges(actor));
  router.post("/learning/badges", ({ body, actor }) => service.createBadge(body, actor));

  router.get("/learning/assignments", ({ actor, query }) => service.listAssignments(actor, query));
  router.post("/learning/assignments", ({ body, actor }) => service.createAssignment(body, actor));

  router.get("/learning/resources", ({ actor, query }) => service.listResources(actor, query));
  router.post("/learning/resources", ({ body, actor }) => service.createResource(body, actor));

  router.get("/learning/attendance", ({ actor, query }) => service.listAttendance(actor, query));
  router.post("/learning/attendance", ({ body, actor }) => service.recordAttendance(body, actor));

  router.get("/learning/submissions", ({ actor, query }) => service.listSubmissions(actor, query));
  router.post("/learning/submissions", ({ body, actor }) => service.createSubmission(body, actor));
  router.patch("/learning/submissions/:id/grade", ({ params, body, actor }) => service.gradeSubmission(params.id, body, actor));

  router.get("/learning/doubts", ({ actor, query }) => service.listDoubts(actor, query));
  router.post("/learning/doubts", ({ body, actor }) => service.createDoubt(body, actor));
  router.patch("/learning/doubts/:id/resolve", ({ params, body, actor }) => service.resolveDoubt(params.id, body, actor));

  router.get("/learning/audit", ({ actor }) => service.listAuditLogs(actor));

  return router;
}
