import { GatewayState } from "./domain";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): GatewayState {
  const now = nowIso(); const firstId = newId("gateway"); const secondId = newId("gateway");
  return { items: [
    { id: firstId, tenantId, createdAt: now, updatedAt: now, key: "gateway-registry", name: "Gateway Registry", description: "Starter registry item for GatewayOS.", type: "Gateway", status: "active", ownerId: "system", tags: ["starter", "registry"], attributes: { purpose: "Gateway routing, traffic control, request validation, authentication gateway, service gateway, tenant gateway, edge gateway, and policy enforcement." }, metadata: { source: "planning", toolsCatalog: "gatewayos-tools.md" } },
    { id: secondId, tenantId, createdAt: now, updatedAt: now, key: "gateway-lifecycle", name: "Gateway Lifecycle", description: "Starter lifecycle item for GatewayOS operations.", type: "GatewayRoute", status: "pending_review", ownerId: "system", tags: ["starter", "lifecycle"], attributes: { ownedEntities: ["Gateway","GatewayRoute","GatewayService","GatewayPolicy","TrafficRule","RateLimit","GatewayTrace","GatewayIncident"] }, metadata: { source: "planning", toolsCatalog: "gatewayos-tools.md" } }
  ], runs: [], events: [{ id: newId("event"), tenantId, createdAt: now, updatedAt: now, type: "gateway.seeded", source: "GatewayOS", itemId: firstId, payload: { items: 2 } }], auditLogs: [] };
}
