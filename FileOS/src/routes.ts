import { docs } from "./docs";
import { Router } from "./core/http";
import { FileService } from "./service";
import { listPermissions } from "./core/datastore";

export function registerRoutes(router: Router, service: FileService): Router {
  router.get("/health", () => ({ service: "FileOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: listPermissions(actor.role) }));

  router.get("/fileos/overview", ({ actor }) => service.overview(actor), "file.read");

  router.get("/fileos/buckets", ({ actor }) => service.listBuckets(actor), "file.read");
  router.post("/fileos/buckets", ({ body, actor }) => service.createBucket(body, actor), "file.write");

  router.get("/fileos/folders", ({ actor, query }) => service.listFolders(actor, query), "file.read");
  router.post("/fileos/folders", ({ body, actor }) => service.createFolder(body, actor), "file.write");
  router.get("/fileos/folders/:id", ({ params, actor }) => service.getFolder(params.id, actor), "file.read");
  router.patch("/fileos/folders/:id", ({ params, body, actor }) => service.updateFolder(params.id, body, actor), "file.write");
  router.delete("/fileos/folders/:id", ({ params, actor }) => { service.deleteFolder(params.id, actor); return { deleted: true }; }, "file.delete");

  router.get("/fileos/files", ({ actor, query }) => service.listFiles(actor, query), "file.read");
  router.post("/fileos/files", ({ body, actor }) => service.createFile(body, actor), "file.upload");
  router.get("/fileos/files/:id", ({ params, actor }) => service.getFile(params.id, actor), "file.read");
  router.patch("/fileos/files/:id", ({ params, body, actor }) => service.updateFile(params.id, body, actor), "file.update");
  router.delete("/fileos/files/:id", ({ params, actor }) => { service.deleteFile(params.id, actor); return { deleted: true }; }, "file.delete");

  router.post("/fileos/files/:id/scan", ({ params, actor }) => service.scanFile(params.id, actor), "file.scan");

  router.get("/fileos/files/:id/versions", ({ params, actor }) => service.listVersions(params.id, actor), "file.read");
  router.post("/fileos/files/:id/versions", ({ params, body, actor }) => service.createVersion(params.id, body, actor), "file.upload");
  router.post("/fileos/files/:id/versions/:versionId/restore", ({ params, actor }) => service.restoreVersion(params.id, params.versionId, actor), "file.restore");

  router.get("/fileos/files/:id/share-links", ({ params, actor }) => service.listShareLinks(actor, new URLSearchParams({ fileId: params.id })), "file.read");
  router.post("/fileos/files/:id/share-links", ({ params, body, actor }) => service.createShareLink(params.id, body, actor), "file.share");
  router.delete("/fileos/share-links/:shareLinkId", ({ params, actor }) => { service.revokeShareLink(params.shareLinkId, actor); return { revoked: true }; }, "file.share");

  router.get("/fileos/share/:token", ({ params, actor }) => service.getShareLink(params.token, actor));
  router.post("/fileos/files/:id/download", ({ params, actor }) => { service.recordDownload(params.id, actor); return { downloadRecorded: true }; }, "file.download");

  router.get("/fileos/files/:id/permissions", ({ params, actor }) => service.listPermissions(params.id, actor), "file.read");
  router.post("/fileos/files/:id/permissions", ({ params, body, actor }) => service.grantPermission(params.id, body, actor), "file.manage_permissions");
  router.delete("/fileos/permissions/:permissionId", ({ params, actor }) => { service.revokePermission(params.permissionId, actor); return { revoked: true }; }, "file.manage_permissions");

  router.get("/fileos/files/:id/analytics", ({ params, actor }) => service.getFileAnalytics(params.id, actor), "file.read");

  router.post("/fileos/search", ({ body, actor }) => service.searchFiles(body, actor), "file.read");

  router.get("/fileos/uploads", ({ actor, query }) => service.listUploads(actor, query), "file.read");
  router.post("/fileos/uploads", ({ body, actor }) => service.createUpload(body, actor), "file.upload");
  router.patch("/fileos/uploads/:id", ({ params, body, actor }) => service.updateUpload(params.id, body, actor), "file.upload");

  router.get("/fileos/retention-rules", ({ actor }) => service.listRetentionRules(actor), "file.read");
  router.post("/fileos/retention-rules", ({ body, actor }) => service.createRetentionRule(body, actor), "file.write");

  router.get("/fileos/events", ({ actor }) => service.listEvents(actor), "file.read");
  router.get("/fileos/audit", ({ actor, query }) => service.listAuditLogs(actor, query), "file.audit.read");

  return router;
}
