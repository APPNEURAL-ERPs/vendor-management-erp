import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router, sendJson } from "./core/http";
import { LicenseService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";

const port = Number(process.env.PORT ?? 10700);
const dbFile = process.env.LICENSEOS_DB_FILE ?? "data/licenseos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().licenses.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new LicenseService(store);
const router = new Router();

router.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

router.get("/licenseos/docs", async () => docs());

router.get("/licenseos/overview", async (ctx) => {
  return service.getOverview(ctx.actor);
});

router.get("/licenseos/licenses", async (ctx) => {
  const query = ctx.query.get("query") || undefined;
  const filters = {
    status: ctx.query.get("status") || undefined,
    plan: ctx.query.get("plan") || undefined,
    type: ctx.query.get("type") || undefined,
    ownerId: ctx.query.get("ownerId") || undefined
  };
  return service.searchLicenses(ctx.actor, query, filters);
});

router.post("/licenseos/licenses", async (ctx) => {
  return service.createLicense(ctx.actor, ctx.body);
});

router.get("/licenseos/licenses/:id", async (ctx) => {
  return service.getLicense(ctx.actor, ctx.params.id);
});

router.patch("/licenseos/licenses/:id", async (ctx) => {
  return service.updateLicense(ctx.actor, ctx.params.id, ctx.body);
});

router.post("/licenseos/licenses/:id/activate", async (ctx) => {
  return service.activateLicense(ctx.actor, ctx.params.id);
});

router.post("/licenseos/licenses/:id/suspend", async (ctx) => {
  return service.suspendLicense(ctx.actor, ctx.params.id, ctx.body?.reason);
});

router.post("/licenseos/licenses/:id/revoke", async (ctx) => {
  return service.revokeLicense(ctx.actor, ctx.params.id, ctx.body?.reason);
});

router.post("/licenseos/licenses/:id/validate", async (ctx) => {
  return service.validateLicense(
    ctx.actor,
    ctx.params.id,
    ctx.body?.userId,
    ctx.body?.action,
    ctx.body?.resource
  );
});

router.post("/licenseos/licenses/:id/renew", async (ctx) => {
  return service.createRenewal(ctx.actor, ctx.params.id, ctx.body);
});

router.get("/licenseos/licenses/:id/entitlements", async (ctx) => {
  return service.getEntitlements(ctx.actor, ctx.params.id);
});

router.post("/licenseos/licenses/:id/entitlements", async (ctx) => {
  return service.createEntitlement(ctx.actor, ctx.params.id, ctx.body);
});

router.post("/licenseos/licenses/:id/seats", async (ctx) => {
  return service.assignSeat(ctx.actor, ctx.params.id, ctx.body.userId, ctx.body.seatType);
});

router.delete("/licenseos/licenses/:id/seats/:userId", async (ctx) => {
  return service.releaseSeat(ctx.actor, ctx.params.id, ctx.params.userId);
});

router.post("/licenseos/licenses/:id/compliance", async (ctx) => {
  return service.checkCompliance(ctx.actor, ctx.params.id, ctx.body.checkType);
});

router.post("/licenseos/usage", async (ctx) => {
  return service.recordUsage(ctx.actor, ctx.body);
});

router.get("/licenseos/usage/analytics", async (ctx) => {
  const licenseId = ctx.query.get("licenseId") || undefined;
  const period = ctx.query.get("period") || undefined;
  return service.getUsageAnalytics(ctx.actor, licenseId, period);
});

router.get("/licenseos/renewals", async (ctx) => {
  const renewals = store.getState().renewals.filter((r) => r.tenantId === ctx.actor.tenantId);
  return renewals;
});

router.post("/licenseos/renewals/:id/complete", async (ctx) => {
  return service.completeRenewal(ctx.actor, ctx.params.id);
});

router.get("/licenseos/compliance", async (ctx) => {
  const checks = store.getState().complianceChecks.filter((c) => c.tenantId === ctx.actor.tenantId);
  return checks;
});

router.get("/licenseos/seats", async (ctx) => {
  const seats = store.getState().seats.filter((s) => s.tenantId === ctx.actor.tenantId);
  return seats;
});

router.get("/licenseos/quotas", async (ctx) => {
  const quotas = store.getState().quotas.filter((q) => q.tenantId === ctx.actor.tenantId);
  return quotas;
});

router.get("/licenseos/credit-wallets", async (ctx) => {
  const wallets = store.getState().creditWallets.filter((w) => w.tenantId === ctx.actor.tenantId);
  return wallets;
});

router.get("/licenseos/audit-logs", async (ctx) => {
  const logs = store.getState().auditLogs.filter((l) => l.tenantId === ctx.actor.tenantId);
  return logs;
});

router.get("/licenseos/events", async (ctx) => {
  const events = store.getState().events.filter((e) => e.tenantId === ctx.actor.tenantId);
  return events;
});

router.get("/routes", async () => router.listRoutes());

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`LicenseOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/licenseos/docs`);
  console.log(`Overview: http://localhost:${port}/licenseos/overview`);
  console.log(`Routes:   http://localhost:${port}/routes`);
});
