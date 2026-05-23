import { docs } from "../docs";
import { permissionsFor } from "../core/http";
import { Router } from "../core/http";
import { CareerService } from "../service";

export function registerRoutes(router: Router, service: CareerService): Router {
  router.get("/health", () => ({ service: "CareerOS", status: "ok", message: "CareerOS is running" }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/career/overview", ({ actor }) => service.overview(actor), "career.analytics.read");

  router.get("/career/jobs", ({ actor, query }) => service.listJobs(actor, query), "career.job.read");
  router.post("/career/jobs", ({ body, actor }) => service.createJob(actor, body), "career.job.write");
  router.get("/career/jobs/:id", ({ params, actor }) => service.getJob(actor, params.id), "career.job.read");
  router.patch("/career/jobs/:id", ({ params, body, actor }) => service.updateJob(actor, params.id, body), "career.job.write");

  router.get("/career/applications", ({ actor, query }) => service.listApplications(actor, query), "career.application.read");
  router.post("/career/applications", ({ body, actor }) => service.createApplication(actor, body), "career.application.write");
  router.get("/career/applications/:id", ({ params, actor }) => service.getApplication(actor, params.id), "career.application.read");
  router.patch("/career/applications/:id", ({ params, body, actor }) => service.updateApplication(actor, params.id, body), "career.application.write");

  router.get("/career/interviews", ({ actor, query }) => service.listInterviews(actor, query), "career.interview.read");
  router.post("/career/interviews", ({ body, actor }) => service.createInterview(actor, body), "career.interview.write");
  router.get("/career/interviews/:id", ({ params, actor }) => service.getInterview(actor, params.id), "career.interview.read");
  router.patch("/career/interviews/:id", ({ params, body, actor }) => service.updateInterview(actor, params.id, body), "career.interview.write");

  router.get("/career/offers", ({ actor, query }) => service.listOffers(actor, query), "career.offer.read");
  router.post("/career/offers", ({ body, actor }) => service.createOffer(actor, body), "career.offer.write");
  router.get("/career/offers/:id", ({ params, actor }) => service.getOffer(actor, params.id), "career.offer.read");
  router.patch("/career/offers/:id", ({ params, body, actor }) => service.updateOffer(actor, params.id, body), "career.offer.write");

  router.get("/career/career-paths", ({ actor }) => service.listCareerPaths(actor), "career.careerpath.read");
  router.post("/career/career-paths", ({ body, actor }) => service.createCareerPath(actor, body), "career.careerpath.read");
  router.get("/career/career-paths/:id", ({ params, actor }) => service.getCareerPath(actor, params.id), "career.careerpath.read");

  router.get("/career/skill-profiles", ({ actor }) => service.listSkillProfiles(actor), "career.skillprofile.read");
  router.post("/career/skill-profiles", ({ body, actor }) => service.createSkillProfile(actor, body), "career.skillprofile.read");
  router.get("/career/skill-profiles/:id", ({ params, actor }) => service.getSkillProfile(actor, params.id), "career.skillprofile.read");

  router.get("/career/events", ({ actor }) => service.listEvents(actor));
  router.get("/career/audit", ({ actor }) => service.listAuditLogs(actor));

  return router;
}
