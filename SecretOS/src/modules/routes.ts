import { docs } from "../docs";
import { permissionsFor, Router } from "../core/http";
import { SecretOSService } from "../service";

export function registerRoutes(router: Router, service: SecretOSService): Router {
  router.get("/health", () => ({ service: "SecretOS", status: "ok", version: "1.0.0" }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/secretos/dashboard", ({ actor }) => service.dashboard(actor), "secret.read");
  router.get("/secretos/overview", ({ actor }) => service.overview(actor), "secret.read");

  router.get("/secretos/secrets", ({ actor, query }) => service.listSecrets(actor, query), "secret.read");
  router.post("/secretos/secrets", ({ body, actor }) => service.createSecret(body, actor), "secret.write");
  router.get("/secretos/secrets/:id", ({ params, actor }) => service.getSecret(params.id, actor), "secret.read");
  router.patch("/secretos/secrets/:id", ({ params, body, actor }) => service.updateSecret(params.id, body, actor), "secret.write");
  router.delete("/secretos/secrets/:id", ({ params, actor }) => service.deleteSecret(params.id, actor), "secret.write");

  router.post("/secretos/secrets/:id/rotate", ({ params, body, actor }) => service.rotateSecret(params.id, body, actor), "secret.rotate");
  router.post("/secretos/secrets/:id/revoke", ({ params, actor }) => service.revokeSecret(params.id, actor), "secret.revoke");

  router.get("/secretos/secrets/:id/versions", ({ params, actor }) => service.getSecretVersions(params.id, actor), "secret.read");

  router.post("/secretos/secrets/:id/access-request", ({ params, body, actor }) => service.createAccessRequest(params.id, body, actor), "secret.access.request");
  router.get("/secretos/access-requests", ({ actor, query }) => service.listAccessRequests(actor, query), "secret.read");
  router.post("/secretos/access-requests/:id/approve", ({ params, actor }) => service.approveAccessRequest(params.id, actor), "secret.write");
  router.post("/secretos/access-requests/:id/deny", ({ params, body, actor }) => service.denyAccessRequest(params.id, body, actor), "secret.write");

  router.get("/secretos/policies", ({ actor }) => service.listRotationPolicies(actor), "secret.read");
  router.post("/secretos/policies", ({ body, actor }) => service.createRotationPolicy(body, actor), "secret.policy.manage");

  router.get("/secretos/api-keys", ({ actor, query }) => service.listAPIKeys(actor, query), "secret.read");
  router.post("/secretos/api-keys", ({ body, actor }) => service.createAPIKey(body, actor), "secret.write");
  router.post("/secretos/api-keys/:id/revoke", ({ params, actor }) => service.revokeAPIKey(params.id, actor), "secret.revoke");

  router.get("/secretos/credentials", ({ actor, query }) => service.listCredentials(actor, query), "secret.read");
  router.post("/secretos/credentials", ({ body, actor }) => service.createCredential(body, actor), "secret.write");

  router.get("/secretos/risks", ({ actor, query }) => service.listSecretRisks(actor, query), "secret.risk.view");
  router.post("/secretos/leak-events", ({ body, actor }) => service.createLeakEvent(body, actor), "secret.write");
  router.post("/secretos/secrets/scan", ({ body, actor }) => service.scanForLeaks(body, actor), "secret.read");

  router.get("/secretos/audit", ({ actor, query }) => service.listAuditLogs(actor, query), "secret.audit.read");
  router.get("/secretos/usage", ({ actor, query }) => service.listUsage(actor, query), "secret.audit.read");

  router.get("/secretos/namespaces", ({ actor }) => service.listNamespaces(actor), "secret.read");

  return router;
}
