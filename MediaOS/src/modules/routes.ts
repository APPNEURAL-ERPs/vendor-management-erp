import { docs } from "../docs";
import { Router } from "../core/http";
import { MediaService } from "../services/media.service";

export function registerRoutes(router: Router, service: MediaService): Router {
  router.get("/health", () => ({ service: "MediaOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

  router.get("/mediaos/overview", ({ actor }) => service.overview(actor), "media.overview.view");

  router.get("/mediaos/libraries", ({ actor }) => service.listLibraries(actor), "media.library.read");
  router.post("/mediaos/libraries", ({ body, actor }) => service.createLibrary(body, actor), "media.library.write");

  router.get("/mediaos/assets", ({ actor, query }) => service.listAssets(actor, query), "media.asset.read");
  router.post("/mediaos/assets", ({ body, actor }) => service.createAsset(body, actor), "media.asset.write");
  router.get("/mediaos/assets/:id", ({ params, actor }) => service.getAsset(params.id, actor), "media.asset.read");
  router.patch("/mediaos/assets/:id", ({ params, body, actor }) => service.updateAsset(params.id, body, actor), "media.asset.write");
  router.delete("/mediaos/assets/:id", ({ params, actor }) => service.deleteAsset(params.id, actor), "media.asset.write");

  router.get("/mediaos/assets/:id/thumbnails", ({ params, actor }) => service.listThumbnails(actor, params.id), "media.asset.read");
  router.post("/mediaos/assets/:id/thumbnail", ({ params, body, actor }) => service.generateThumbnail(params.id, body, actor), "media.job.run");

  router.get("/mediaos/assets/:id/renditions", ({ params, actor }) => service.listRenditions(actor, params.id), "media.asset.read");
  router.post("/mediaos/assets/:id/renditions", ({ params, body, actor }) => service.createRendition(params.id, body, actor), "media.asset.write");

  router.get("/mediaos/assets/:id/analytics", ({ params, body, actor }) => service.recordAnalytics(params.id, body, actor), "media.analytics.read");
  router.post("/mediaos/assets/:id/analytics", ({ params, body, actor }) => service.recordAnalytics(params.id, body, actor), "media.analytics.write");

  router.get("/mediaos/folders", ({ actor }) => service.listFolders(actor), "media.asset.read");
  router.post("/mediaos/folders", ({ body, actor }) => service.createFolder(body, actor), "media.asset.write");

  router.get("/mediaos/jobs", ({ actor, query }) => service.listProcessingJobs(actor, query), "media.job.read");
  router.post("/mediaos/jobs", ({ body, actor }) => service.createProcessingJob(body, actor), "media.job.run");
  router.patch("/mediaos/jobs/:id", ({ params, body, actor }) => service.updateProcessingJob(params.id, body, actor), "media.job.write");

  router.get("/mediaos/events", ({ actor }) => service.listEvents(actor), "media.asset.read");
  router.get("/mediaos/audit", ({ actor }) => service.listAuditLogs(actor), "media.audit.read");

  return router;
}
