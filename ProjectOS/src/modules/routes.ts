import { docs } from "../docs";
import { Router } from "../core/http";
import { ProjectosService } from "../service";

export function registerRoutes(router: Router, service: ProjectosService): Router {
  router.get("/health", () => ({ service: "ProjectOS", status: "ok", message: "ProjectOS is running" }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

  router.get("/projectos/overview", ({ actor }) => service.overview(actor), "project.read");

  router.get("/projectos/projects", ({ actor, query }) => service.listProjects(actor, query), "project.read");
  router.post("/projectos/projects", ({ body, actor }) => service.createProject(body, actor), "project.write");
  router.get("/projectos/projects/:id", ({ params, actor }) => service.getProject(params.id, actor), "project.read");
  router.patch("/projectos/projects/:id", ({ params, body, actor }) => service.updateProject(params.id, body, actor), "project.write");

  router.get("/projectos/milestones", ({ actor, query }) => service.listMilestones(actor, query), "project.read");
  router.post("/projectos/milestones", ({ body, actor }) => service.createMilestone(body, actor), "project.milestone.write");
  router.patch("/projectos/milestones/:id", ({ params, body, actor }) => service.updateMilestone(params.id, body, actor), "project.milestone.write");

  router.get("/projectos/sprints", ({ actor, query }) => service.listSprints(actor, query), "project.read");
  router.post("/projectos/sprints", ({ body, actor }) => service.createSprint(body, actor), "project.sprint.write");
  router.patch("/projectos/sprints/:id", ({ params, body, actor }) => service.updateSprint(params.id, body, actor), "project.sprint.write");

  router.get("/projectos/tasks", ({ actor, query }) => service.listTasks(actor, query), "project.read");
  router.post("/projectos/tasks", ({ body, actor }) => service.createTask(body, actor), "project.task.write");
  router.patch("/projectos/tasks/:id", ({ params, body, actor }) => service.updateTask(params.id, body, actor), "project.task.write");

  router.get("/projectos/resources", ({ actor, query }) => service.listResources(actor, query), "project.resource.read");
  router.post("/projectos/resources", ({ body, actor }) => service.createResource(body, actor), "project.resource.write");

  router.get("/projectos/budgets", ({ actor, query }) => service.listBudgets(actor, query), "project.budget.read");
  router.post("/projectos/budgets", ({ body, actor }) => service.createBudget(body, actor), "project.budget.write");
  router.patch("/projectos/budgets/:id", ({ params, body, actor }) => service.updateBudget(params.id, body, actor), "project.budget.write");

  router.get("/projectos/time-entries", ({ actor, query }) => service.listTimeEntries(actor, query), "project.read");
  router.post("/projectos/time-entries", ({ body, actor }) => service.createTimeEntry(body, actor), "project.write");

  router.get("/projectos/phases", ({ actor, query }) => service.listPhases(actor, query), "project.read");
  router.post("/projectos/phases", ({ body, actor }) => service.createPhase(body, actor), "project.write");

  router.get("/projectos/risks", ({ actor, query }) => service.listRisks(actor, query), "project.read");
  router.post("/projectos/risks", ({ body, actor }) => service.createRisk(body, actor), "project.write");

  router.get("/projectos/issues", ({ actor, query }) => service.listIssues(actor, query), "project.read");
  router.post("/projectos/issues", ({ body, actor }) => service.createIssue(body, actor), "project.write");

  router.get("/projectos/audit", ({ actor }) => service.listAuditLogs(actor), "project.audit.read");

  return router;
}
