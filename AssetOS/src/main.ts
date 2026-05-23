import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { AssetService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";
import { permissionsFor } from "./core/http";

const port = Number(process.env.PORT ?? 11700);
const dbFile = process.env.ASSETOS_DB_FILE ?? "data/assetos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().assets.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new AssetService(store);
const router = new Router();

router.get("/health", () => ({ service: "AssetOS", status: "ok", message: service.getRoutesSummary() }));
router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

router.get("/assetos/overview", ({ actor }) => service.overview(actor), "asset.read");

router.get("/assetos/categories", ({ actor }) => service.listCategories(actor), "asset.category.read");
router.post("/assetos/categories", ({ body, actor }) => service.createCategory(body, actor), "asset.category.create");
router.get("/assetos/categories/:id", ({ params, actor }) => service.getCategory(params.id, actor), "asset.category.read");
router.patch("/assetos/categories/:id", ({ params, body, actor }) => service.updateCategory(params.id, body, actor), "asset.category.update");

router.get("/assetos/assets", ({ actor, query }) => service.listAssets(actor, query), "asset.read");
router.post("/assetos/assets", ({ body, actor }) => service.createAsset(body, actor), "asset.create");
router.get("/assetos/assets/:id", ({ params, actor }) => service.getAsset(params.id, actor), "asset.read");
router.patch("/assetos/assets/:id", ({ params, body, actor }) => service.updateAsset(params.id, body, actor), "asset.update");
router.delete("/assetos/assets/:id", ({ params, actor }) => service.archiveAsset(params.id, actor), "asset.delete");

router.get("/assetos/assignments", ({ actor, query }) => service.listAssignments(actor, query), "asset.assignment.read");
router.post("/assetos/assignments", ({ body, actor }) => service.createAssignment(body, actor), "asset.assignment.create");
router.get("/assetos/assignments/:id", ({ params, actor }) => service.getAssignment(params.id, actor), "asset.assignment.read");
router.post("/assetos/assignments/:id/return", ({ params, body, actor }) => service.returnAsset(params.id, body, actor), "asset.assignment.update");

router.get("/assetos/maintenance", ({ actor, query }) => service.listMaintenanceRecords(actor, query), "asset.maintenance.read");
router.post("/assetos/maintenance", ({ body, actor }) => service.createMaintenanceRecord(body, actor), "asset.maintenance.create");
router.get("/assetos/maintenance/:id", ({ params, actor }) => service.getMaintenanceRecord(params.id, actor), "asset.maintenance.read");
router.patch("/assetos/maintenance/:id", ({ params, body, actor }) => service.updateMaintenanceRecord(params.id, body, actor), "asset.maintenance.update");

router.get("/assetos/warranties", ({ actor, query }) => service.listWarranties(actor, query), "asset.warranty.read");
router.post("/assetos/warranties", ({ body, actor }) => service.createWarranty(body, actor), "asset.warranty.create");
router.get("/assetos/warranties/:id", ({ params, actor }) => service.getWarranty(params.id, actor), "asset.warranty.read");

router.get("/assetos/depreciations", ({ actor, query }) => service.listDepreciations(actor, query), "asset.depreciation.read");
router.post("/assetos/depreciations", ({ body, actor }) => service.createDepreciation(body, actor), "asset.depreciation.create");
router.get("/assetos/depreciations/:id", ({ params, actor }) => service.getDepreciation(params.id, actor), "asset.depreciation.read");
router.post("/assetos/depreciations/:id/calculate", ({ params, body, actor }) => service.calculateDepreciation(params.id, Number(body?.monthsElapsed ?? 1), actor), "asset.depreciation.update");

router.get("/assetos/audits", ({ actor, query }) => service.listAudits(actor, query), "asset.audit.read");
router.post("/assetos/audits", ({ body, actor }) => service.createAudit(body, actor), "asset.audit.create");
router.get("/assetos/audits/:id", ({ params, actor }) => service.getAudit(params.id, actor), "asset.audit.read");
router.post("/assetos/audits/:id/complete", ({ params, body, actor }) => service.completeAudit(params.id, body, actor), "asset.audit.update");

router.get("/assetos/runs", ({ actor }) => service.listRuns(actor), "asset.read");
router.post("/assetos/runs", ({ body, actor }) => service.createRun(body, actor), "asset.create");

router.get("/assetos/events", ({ actor }) => service.listEvents(actor), "asset.read");
router.get("/assetos/audit", ({ actor }) => service.listAuditLogs(actor), "asset.audit.read");

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`AssetOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
