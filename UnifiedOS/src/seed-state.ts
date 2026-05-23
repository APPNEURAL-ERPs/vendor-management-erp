import { UnifiedState } from "./domain";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): UnifiedState {
  const now = nowIso(); const firstId = newId("unified"); const secondId = newId("unified");
  return { items: [
    { id: firstId, tenantId, createdAt: now, updatedAt: now, key: "unified-registry", name: "Unified Registry", description: "Starter registry item for UnifiedOS.", type: "OSModule", status: "active", ownerId: "system", tags: ["starter", "registry"], attributes: { purpose: "Cross-OS orchestration that connects all AppNeuroX OS modules into one registry, dependency graph, workflow layer, event layer, and command center." }, metadata: { source: "planning", toolsCatalog: "unifiedos-tools.md" } },
    { id: secondId, tenantId, createdAt: now, updatedAt: now, key: "unified-lifecycle", name: "Unified Lifecycle", description: "Starter lifecycle item for UnifiedOS operations.", type: "OSDependency", status: "pending_review", ownerId: "system", tags: ["starter", "lifecycle"], attributes: { ownedEntities: ["OSModule","OSDependency","CrossOSWorkflow","OSEventRoute","UnifiedCommand","HealthSignal","ImpactReport","IntegrationMap"] }, metadata: { source: "planning", toolsCatalog: "unifiedos-tools.md" } }
  ], runs: [], events: [{ id: newId("event"), tenantId, createdAt: now, updatedAt: now, type: "unified.seeded", source: "UnifiedOS", itemId: firstId, payload: { items: 2 } }], auditLogs: [] };
}
