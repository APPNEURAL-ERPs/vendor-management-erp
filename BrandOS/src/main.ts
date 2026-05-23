import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { BrandService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";

const PORT = Number(process.env.PORT ?? 9100);
const DB_FILE = process.env.BRANDOS_DB_FILE ?? "data/brandos.db.json";
const TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(DB_FILE);
if (store.getState().brands.length === 0) {
  store.reset(createSeedState(TENANT_ID));
}

const service = new BrandService(store);
const router = new Router();

router.get("/health", () => ({ status: "ok", service: "BrandOS", version: "1.0.0" }));
router.get("/docs", () => docs());
router.get("/routes", () => router.listRoutes());

router.get("/brandos", (ctx) => service.overview(ctx.actor));
router.get("/brandos/brands", (ctx) => service.listBrands(ctx.actor, ctx.query));
router.get("/brandos/brands/:id", (ctx) => service.getBrand(ctx.params.id, ctx.actor));
router.post("/brandos/brands", (ctx) => service.createBrand(ctx.body, ctx.actor), "brand.write");
router.patch("/brandos/brands/:id", (ctx) => service.updateBrand(ctx.params.id, ctx.body, ctx.actor), "brand.write");

router.get("/brandos/color-palettes", (ctx) => service.listColorPalettes(ctx.actor, ctx.query));
router.post("/brandos/color-palettes", (ctx) => service.createColorPalette(ctx.body, ctx.actor), "brand.write");

router.get("/brandos/typographies", (ctx) => service.listTypographies(ctx.actor, ctx.query));
router.post("/brandos/typographies", (ctx) => service.createTypography(ctx.body, ctx.actor), "brand.write");

router.get("/brandos/brand-voices", (ctx) => service.listBrandVoices(ctx.actor, ctx.query));
router.post("/brandos/brand-voices", (ctx) => service.createBrandVoice(ctx.body, ctx.actor), "brand.write");

router.get("/brandos/brand-elements", (ctx) => service.listBrandElements(ctx.actor, ctx.query));
router.post("/brandos/brand-elements", (ctx) => service.createBrandElement(ctx.body, ctx.actor), "brand.write");

router.get("/brandos/assets", (ctx) => service.listAssets(ctx.actor, ctx.query));
router.post("/brandos/assets", (ctx) => service.createAsset(ctx.body, ctx.actor), "brand.asset.manage");
router.post("/brandos/assets/:id/approve", (ctx) => service.approveAsset(ctx.params.id, ctx.actor), "brand.asset.manage");

router.get("/brandos/guidelines", (ctx) => service.listGuidelines(ctx.actor, ctx.query));
router.post("/brandos/guidelines", (ctx) => service.createGuideline(ctx.body, ctx.actor), "brand.guideline.manage");
router.post("/brandos/guidelines/generate", (ctx) => service.generateGuideline(ctx.body.brandId, ctx.body, ctx.actor), "brand.guideline.manage");

router.get("/brandos/kits", (ctx) => service.listBrandKits(ctx.actor, ctx.query));
router.post("/brandos/kits", (ctx) => service.createBrandKit(ctx.body, ctx.actor), "brand.kit.manage");

router.get("/brandos/messages", (ctx) => service.listBrandMessages(ctx.actor, ctx.query));
router.post("/brandos/messages", (ctx) => service.createBrandMessage(ctx.body, ctx.actor), "brand.write");

router.get("/brandos/campaigns", (ctx) => service.listCampaigns(ctx.actor, ctx.query));
router.post("/brandos/campaigns", (ctx) => service.createCampaign(ctx.body, ctx.actor), "brand.write");

router.get("/brandos/audits", (ctx) => service.listAudits(ctx.actor, ctx.query));
router.post("/brandos/audits", (ctx) => service.createAudit(ctx.body, ctx.actor), "brand.write");
router.post("/brandos/audits/:id/run", (ctx) => service.runAudit(ctx.params.id, ctx.actor), "brand.audit.read");

router.get("/brandos/consistency", (ctx) => service.listConsistencyChecks(ctx.actor));
router.post("/brandos/consistency/check", (ctx) => service.runConsistencyCheck(ctx.body, ctx.actor), "brand.audit.read");

router.get("/brandos/templates", (ctx) => service.listTemplates(ctx.actor, ctx.query));
router.post("/brandos/templates", (ctx) => service.createTemplate(ctx.body, ctx.actor), "brand.write");

router.get("/brandos/personas", (ctx) => service.listPersonas(ctx.actor, ctx.query));
router.post("/brandos/personas", (ctx) => service.createPersona(ctx.body, ctx.actor), "brand.write");

router.get("/brandos/audit-logs", () => service.listAuditLogs({ tenantId: TENANT_ID, userId: "system", role: "admin" }), "brand.audit.read");

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(PORT, () => {
  console.log(`BrandOS running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Docs:   http://localhost:${PORT}/docs`);
  console.log(`Routes: http://localhost:${PORT}/routes`);
});
