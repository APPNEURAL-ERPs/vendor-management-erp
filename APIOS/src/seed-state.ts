import { APIState } from "./domain";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): APIState {
  const now = nowIso(); const firstId = newId("api"); const secondId = newId("api");
  return { items: [
    { id: firstId, tenantId, createdAt: now, updatedAt: now, key: "api-registry", name: "API Registry", description: "Starter registry item for APIOS.", type: "API", status: "active", ownerId: "system", tags: ["starter", "registry"], attributes: { purpose: "API design, contracts, endpoint generation, SDK generation, versioning, rate limiting, documentation, testing, monitoring, and API lifecycle management." }, metadata: { source: "planning", toolsCatalog: "apios-tools.md" } },
    { id: secondId, tenantId, createdAt: now, updatedAt: now, key: "api-lifecycle", name: "API Lifecycle", description: "Starter lifecycle item for APIOS operations.", type: "Endpoint", status: "pending_review", ownerId: "system", tags: ["starter", "lifecycle"], attributes: { ownedEntities: ["API","Endpoint","APIContract","APIVersion","APIConsumer","RateLimitPolicy","SDKPackage","APITest","APIMetric"] }, metadata: { source: "planning", toolsCatalog: "apios-tools.md" } }
  ], runs: [], events: [{ id: newId("event"), tenantId, createdAt: now, updatedAt: now, type: "api.seeded", source: "APIOS", itemId: firstId, payload: { items: 2 } }], auditLogs: [] };
}
