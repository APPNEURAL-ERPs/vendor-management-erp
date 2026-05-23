import { docs } from "../docs";
import { Router } from "../core/http";
import { PeopleService } from "../service";

export function registerRoutes(router: Router, service: PeopleService): Router {
  router.get("/health", () => ({ service: "PeopleOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

  router.get("/people/overview", ({ actor }) => service.overview(actor), "people.overview.view");

  router.get("/people/employees", ({ actor, query }) => service.listEmployees(actor, query), "people.employee.read");
  router.post("/people/employees", ({ body, actor }) => service.createEmployee(body, actor), "people.employee.write");
  router.get("/people/employees/:id", ({ params, actor }) => service.getEmployee(params.id, actor), "people.employee.read");
  router.patch("/people/employees/:id", ({ params, body, actor }) => service.updateEmployee(params.id, body, actor), "people.employee.write");

  router.get("/people/departments", ({ actor }) => service.listDepartments(actor), "people.department.read");
  router.post("/people/departments", ({ body, actor }) => service.createDepartment(body, actor), "people.department.write");

  router.get("/people/teams", ({ actor }) => service.listTeams(actor), "people.team.read");
  router.post("/people/teams", ({ body, actor }) => service.createTeam(body, actor), "people.team.write");

  router.get("/people/roles", ({ actor }) => service.listRoles(actor), "people.role.read");
  router.post("/people/roles", ({ body, actor }) => service.createRole(body, actor), "people.role.write");

  router.get("/people/pipelines", ({ actor }) => service.listPipelines(actor), "people.pipeline.read");
  router.post("/people/pipelines", ({ body, actor }) => service.createPipeline(body, actor), "people.pipeline.write");

  router.get("/people/candidates", ({ actor, query }) => service.listCandidates(actor, query), "people.candidate.read");
  router.post("/people/candidates", ({ body, actor }) => service.createCandidate(body, actor), "people.candidate.write");
  router.patch("/people/candidates/:id/stage", ({ params, body, actor }) => service.updateCandidateStage(params.id, body, actor), "people.candidate.write");

  router.post("/people/interviews", ({ body, actor }) => service.createInterview(body, actor), "people.interview.write");

  router.post("/people/offers", ({ body, actor }) => service.createOffer(body, actor), "people.offer.write");

  router.post("/people/onboarding", ({ body, actor }) => service.createOnboardingChecklist(body, actor), "people.onboarding.write");

  router.get("/people/leaves", ({ actor, query }) => service.listLeaveRequests(actor, query), "people.leave.read");
  router.post("/people/leaves", ({ body, actor }) => service.createLeaveRequest(body, actor), "people.leave.write");
  router.patch("/people/leaves/:id/approve", ({ params, body, actor }) => service.approveLeaveRequest(params.id, body, actor), "people.leave.write");

  router.get("/people/reviews", ({ actor, query }) => service.listPerformanceReviews(actor, query), "people.review.read");
  router.post("/people/reviews", ({ body, actor }) => service.createPerformanceReview(body, actor), "people.review.write");

  router.post("/people/goals", ({ body, actor }) => service.createGoal(body, actor), "people.goal.write");

  router.get("/people/engagements", ({ actor, query }) => service.listEngagements(actor, query), "people.engagement.read");
  router.post("/people/engagements", ({ body, actor }) => service.createEngagement(body, actor), "people.engagement.write");

  router.get("/people/audit", ({ actor }) => service.listAuditLogs(actor), "people.audit.read");

  return router;
}
