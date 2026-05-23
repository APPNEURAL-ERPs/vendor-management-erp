import { buildDocs } from "../docs";
import { Router } from "../core/http";
import { BacklogItem, EntityStatus, FeatureStatus, ProductLifecycleStage, ReleaseStatus, RequirementStatus, RoadmapStatus, VersionStatus } from "../core/domain";
import { ProductService } from "../services/product.service";

export function registerRoutes(router: Router, service: ProductService): Router {
  router.get("/health", () => ({ status: "ok", os: "ProductOS", version: "1.0.0" }));
  router.get("/docs", () => buildDocs(router.listRoutes()));
  router.get("/productos/overview", (ctx) => service.overview(ctx.actor), "product.read");
  router.get("/productos/events", (ctx) => service.listEvents(ctx.actor), "product.read");
  router.get("/productos/audit-logs", (ctx) => service.listAuditLogs(ctx.actor), "product.audit.read");

  router.get("/productos/products", (ctx) => service.listProducts(ctx.actor, { status: ctx.query.get("status") ?? undefined, lifecycleStage: ctx.query.get("lifecycleStage") ?? undefined, ownerId: ctx.query.get("ownerId") ?? undefined }), "product.read");
  router.get("/productos/products/:id", (ctx) => service.getProduct(ctx.actor, ctx.params.id), "product.read");
  router.post("/productos/products", (ctx) => service.createProduct(ctx.actor, ctx.body as any), "product.products.write");
  router.patch("/productos/products/:id/lifecycle", (ctx) => service.updateProductLifecycle(ctx.actor, ctx.params.id, (ctx.body as any).lifecycleStage as ProductLifecycleStage, (ctx.body as any).status as EntityStatus | undefined), "product.lifecycle.write");
  router.post("/productos/products/:id/archive", (ctx) => service.archiveProduct(ctx.actor, ctx.params.id), "product.lifecycle.write");

  router.get("/productos/versions", (ctx) => service.listVersions(ctx.actor, { productId: ctx.query.get("productId") ?? undefined, status: ctx.query.get("status") ?? undefined }), "product.read");
  router.get("/productos/versions/:id", (ctx) => service.getVersion(ctx.actor, ctx.params.id), "product.read");
  router.post("/productos/versions", (ctx) => service.createVersion(ctx.actor, ctx.body as any), "product.versions.write");
  router.patch("/productos/versions/:id/status", (ctx) => service.updateVersionStatus(ctx.actor, ctx.params.id, (ctx.body as any).status as VersionStatus), "product.versions.write");

  router.get("/productos/roadmap", (ctx) => service.listRoadmapItems(ctx.actor, { productId: ctx.query.get("productId") ?? undefined, status: ctx.query.get("status") ?? undefined, quarter: ctx.query.get("quarter") ?? undefined }), "product.read");
  router.get("/productos/roadmap/:id", (ctx) => service.getRoadmapItem(ctx.actor, ctx.params.id), "product.read");
  router.post("/productos/roadmap", (ctx) => service.createRoadmapItem(ctx.actor, ctx.body as any), "product.roadmap.write");
  router.patch("/productos/roadmap/:id/status", (ctx) => service.updateRoadmapStatus(ctx.actor, ctx.params.id, (ctx.body as any).status as RoadmapStatus), "product.roadmap.write");

  router.get("/productos/requirements", (ctx) => service.listRequirements(ctx.actor, { productId: ctx.query.get("productId") ?? undefined, status: ctx.query.get("status") ?? undefined }), "product.read");
  router.get("/productos/requirements/:id", (ctx) => service.getRequirement(ctx.actor, ctx.params.id), "product.read");
  router.post("/productos/requirements", (ctx) => service.createRequirement(ctx.actor, ctx.body as any), "product.requirements.write");
  router.post("/productos/requirements/:id/approve", (ctx) => service.approveRequirement(ctx.actor, ctx.params.id), "product.requirements.approve");
  router.post("/productos/requirements/:id/reject", (ctx) => service.rejectRequirement(ctx.actor, ctx.params.id), "product.requirements.approve");

  router.get("/productos/features", (ctx) => service.listFeatures(ctx.actor, { productId: ctx.query.get("productId") ?? undefined, status: ctx.query.get("status") ?? undefined, ownerId: ctx.query.get("ownerId") ?? undefined }), "product.read");
  router.get("/productos/features/rank", (ctx) => service.rankFeatures(ctx.actor, ctx.query.get("productId") ?? undefined), "product.analytics.read");
  router.get("/productos/features/:id", (ctx) => service.getFeature(ctx.actor, ctx.params.id), "product.read");
  router.post("/productos/features", (ctx) => service.createFeature(ctx.actor, ctx.body as any), "product.features.write");
  router.patch("/productos/features/:id/status", (ctx) => service.updateFeatureStatus(ctx.actor, ctx.params.id, (ctx.body as any).status as FeatureStatus), "product.features.write");

  router.get("/productos/backlog", (ctx) => service.listBacklogItems(ctx.actor, { productId: ctx.query.get("productId") ?? undefined, status: ctx.query.get("status") ?? undefined }), "product.read");
  router.get("/productos/backlog/:id", (ctx) => service.getBacklogItem(ctx.actor, ctx.params.id), "product.read");
  router.post("/productos/backlog", (ctx) => service.createBacklogItem(ctx.actor, ctx.body as any), "product.backlog.write");
  router.patch("/productos/backlog/:id/status", (ctx) => service.updateBacklogStatus(ctx.actor, ctx.params.id, (ctx.body as any).status as BacklogItem["status"]), "product.backlog.write");

  router.get("/productos/components", (ctx) => service.listComponents(ctx.actor, { status: ctx.query.get("status") ?? undefined }), "product.read");
  router.get("/productos/components/:id", (ctx) => service.getComponent(ctx.actor, ctx.params.id), "product.read");
  router.post("/productos/components", (ctx) => service.createComponent(ctx.actor, ctx.body as any), "product.components.write");

  router.get("/productos/boms", (ctx) => service.listBOMs(ctx.actor, { productId: ctx.query.get("productId") ?? undefined, status: ctx.query.get("status") ?? undefined }), "product.read");
  router.get("/productos/boms/:id", (ctx) => service.getBOM(ctx.actor, ctx.params.id), "product.read");
  router.post("/productos/boms", (ctx) => service.createBOM(ctx.actor, ctx.body as any), "product.bom.write");
  router.post("/productos/boms/:id/approve", (ctx) => service.approveBOM(ctx.actor, ctx.params.id), "product.bom.approve");
  router.post("/productos/boms/:id/activate", (ctx) => service.activateBOM(ctx.actor, ctx.params.id), "product.bom.approve");

  router.get("/productos/releases", (ctx) => service.listReleases(ctx.actor, { productId: ctx.query.get("productId") ?? undefined, status: ctx.query.get("status") ?? undefined }), "product.read");
  router.get("/productos/releases/:id", (ctx) => service.getRelease(ctx.actor, ctx.params.id), "product.read");
  router.post("/productos/releases", (ctx) => service.createRelease(ctx.actor, ctx.body as any), "product.releases.write");
  router.post("/productos/releases/:id/approve", (ctx) => service.approveRelease(ctx.actor, ctx.params.id), "product.releases.approve");
  router.post("/productos/releases/:id/schedule", (ctx) => service.scheduleRelease(ctx.actor, ctx.params.id), "product.releases.write");
  router.post("/productos/releases/:id/publish", (ctx) => service.publishRelease(ctx.actor, ctx.params.id), "product.releases.write");
  router.post("/productos/releases/:id/rollback", (ctx) => service.rollbackRelease(ctx.actor, ctx.params.id), "product.releases.write");

  router.get("/productos/change-requests", (ctx) => service.listChangeRequests(ctx.actor, { productId: ctx.query.get("productId") ?? undefined, status: ctx.query.get("status") ?? undefined }), "product.read");
  router.get("/productos/change-requests/:id", (ctx) => service.getChangeRequest(ctx.actor, ctx.params.id), "product.read");
  router.post("/productos/change-requests", (ctx) => service.createChangeRequest(ctx.actor, ctx.body as any), "product.change.write");
  router.post("/productos/change-requests/:id/approve", (ctx) => service.approveChangeRequest(ctx.actor, ctx.params.id), "product.change.approve");
  router.post("/productos/change-requests/:id/reject", (ctx) => service.rejectChangeRequest(ctx.actor, ctx.params.id), "product.change.approve");
  router.post("/productos/change-requests/:id/implement", (ctx) => service.implementChangeRequest(ctx.actor, ctx.params.id), "product.change.write");

  return router;
}
