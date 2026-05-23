import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router, sendJson } from "./core/http";
import { IdentityService } from "./service";
import { createSeedState } from "./seed-state";
import { getDocs } from "./docs";

const PORT = Number(process.env.PORT ?? 5100);
const DB_FILE = process.env.IDENTITYOS_DB_FILE ?? "data/identityos.db.json";
const TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(DB_FILE);
if (store.getState().users.length === 0) {
  console.log("Initializing IdentityOS with seed data...");
  store.reset(createSeedState(TENANT_ID));
  console.log("Seed data created successfully");
}

const service = new IdentityService(store);
const router = new Router();

router.get("/health", async () => ({ status: "ok", service: "IdentityOS", timestamp: new Date().toISOString() }));

router.get("/docs", async () => getDocs());

router.get("/v1/identity/overview", async (ctx) => service.getOverview(ctx.actor.tenantId));

router.get("/v1/identity/users", async (ctx) => service.listUsers(ctx), "identity.user.read");
router.post("/v1/identity/users", async (ctx) => service.createUser(ctx), "identity.user.write");
router.get("/v1/identity/users/:id", async (ctx) => service.getUser(ctx), "identity.user.read");
router.patch("/v1/identity/users/:id", async (ctx) => service.updateUser(ctx), "identity.user.write");
router.delete("/v1/identity/users/:id", async (ctx) => service.deleteUser(ctx), "identity.user.delete");

router.post("/v1/identity/auth/login", async (ctx) => service.login(ctx));
router.post("/v1/identity/auth/logout", async (ctx) => service.logout(ctx));

router.get("/v1/identity/sessions", async (ctx) => service.listSessions(ctx), "identity.session.read");
router.post("/v1/identity/sessions/:sessionId/revoke", async (ctx) => service.revokeSession(ctx), "identity.session.write");

router.post("/v1/identity/password/change", async (ctx) => service.changePassword(ctx));

router.get("/v1/identity/roles", async (ctx) => service.listRoles(ctx), "identity.role.read");
router.post("/v1/identity/roles", async (ctx) => service.createRole(ctx), "identity.role.write");
router.post("/v1/identity/roles/assign", async (ctx) => {
  const { subjectId, roleId, subjectType } = ctx.body;
  service.assignRole(ctx.actor, subjectId, roleId, subjectType || "user");
}, "identity.role.write");
router.post("/v1/identity/roles/revoke", async (ctx) => service.revokeRoleAssignment(ctx), "identity.role.write");

router.get("/v1/identity/permissions", async (ctx) => service.listPermissions(ctx), "identity.permission.read");
router.post("/v1/identity/permissions", async (ctx) => service.createPermission(ctx), "identity.permission.write");

router.post("/v1/identity/mfa/setup", async (ctx) => service.setupMFA(ctx), "identity.mfa.write");
router.post("/v1/identity/mfa/verify", async (ctx) => service.verifyMFA(ctx), "identity.mfa.write");

router.get("/v1/identity/invitations", async () => [], "identity.invitation.read");
router.post("/v1/identity/invitations", async (ctx) => service.createInvitation(ctx), "identity.invitation.write");
router.post("/v1/identity/invitations/:invitationId/accept", async (ctx) => service.acceptInvitation(ctx));

router.get("/v1/identity/groups", async (ctx) => service.listGroups(ctx), "identity.role.read");
router.post("/v1/identity/groups", async (ctx) => service.createGroup(ctx), "identity.role.write");
router.post("/v1/identity/groups/:groupId/members", async (ctx) => service.addUserToGroup(ctx), "identity.role.write");
router.delete("/v1/identity/groups/:groupId/members/:userId", async (ctx) => service.removeUserFromGroup(ctx), "identity.role.write");

router.get("/v1/identity/api-keys", async () => [], "identity.api_key.read");
router.post("/v1/identity/api-keys", async (ctx) => service.createAPIKey(ctx), "identity.api_key.write");
router.post("/v1/identity/api-keys/:id/revoke", async (ctx) => service.revokeAPIKey(ctx), "identity.api_key.write");

router.get("/v1/identity/devices", async (ctx) => service.listTrustedDevices(ctx), "identity.session.read");
router.post("/v1/identity/devices", async (ctx) => service.addTrustedDevice(ctx), "identity.session.write");
router.post("/v1/identity/devices/:id/revoke", async (ctx) => service.revokeTrustedDevice(ctx), "identity.session.write");

router.get("/v1/identity/access-reviews", async () => [], "identity.access_review.read");
router.post("/v1/identity/access-reviews", async (ctx) => service.createAccessReview(ctx), "identity.access_review.write");
router.post("/v1/identity/access-reviews/decide", async (ctx) => service.decideAccessReviewItem(ctx), "identity.access_review.write");

router.get("/v1/identity/risk-events", async (ctx) => service.getRiskEvents(ctx), "identity.user.read");
router.post("/v1/identity/risk-events/:eventId/resolve", async (ctx) => service.resolveRiskEvent(ctx), "identity.user.write");

router.get("/v1/identity/audit-logs", async (ctx) => service.getAuditLogs(ctx), "identity.audit.read");

router.get("/", async () => ({
  service: "IdentityOS",
  version: "1.0.0",
  description: "Identity, authentication, authorization, user profile, account, role, permission, session, SSO, MFA, tenant identity, and identity governance",
  endpoints: {
    health: "/health",
    docs: "/docs",
    overview: "/v1/identity/overview",
    users: "/v1/identity/users",
    roles: "/v1/identity/roles",
    permissions: "/v1/identity/permissions",
    sessions: "/v1/identity/sessions",
    invitations: "/v1/identity/invitations",
    groups: "/v1/identity/groups",
    apiKeys: "/v1/identity/api-keys",
    devices: "/v1/identity/devices",
    accessReviews: "/v1/identity/access-reviews",
    riskEvents: "/v1/identity/risk-events",
    auditLogs: "/v1/identity/audit-logs",
    auth: {
      login: "POST /v1/identity/auth/login",
      logout: "POST /v1/identity/auth/logout"
    },
    mfa: {
      setup: "POST /v1/identity/mfa/setup",
      verify: "POST /v1/identity/mfa/verify"
    },
    password: {
      change: "POST /v1/identity/password/change"
    }
  },
  documentation: "/docs"
}));

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(PORT, () => {
  console.log(`IdentityOS running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Docs:   http://localhost:${PORT}/docs`);
  console.log(`API:    http://localhost:${PORT}/v1/identity/overview`);
});

process.on("SIGTERM", () => {
  console.log("Shutting down IdentityOS...");
  server.close(() => {
    console.log("IdentityOS shut down successfully");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\nShutting down IdentityOS...");
  server.close(() => {
    console.log("IdentityOS shut down successfully");
    process.exit(0);
  });
});
