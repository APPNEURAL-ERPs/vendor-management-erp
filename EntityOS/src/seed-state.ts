import { EntityState } from "./domain";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): EntityState {
  const now = nowIso(); const firstId = newId("entity"); const secondId = newId("entity");
  return { items: [
    { id: firstId, tenantId, createdAt: now, updatedAt: now, key: "entity-registry", name: "Entity Registry", description: "Starter registry item for EntityOS.", type: "EntityType", status: "active", ownerId: "system", tags: ["starter", "registry"], attributes: { purpose: "Universal business object definitions, schemas, records, relationships, lifecycle, ownership, validation, search, audit, and metadata." }, metadata: { source: "planning", toolsCatalog: "entityos-tools.md" } },
    { id: secondId, tenantId, createdAt: now, updatedAt: now, key: "entity-lifecycle", name: "Entity Lifecycle", description: "Starter lifecycle item for EntityOS operations.", type: "EntityRecord", status: "pending_review", ownerId: "system", tags: ["starter", "lifecycle"], attributes: { ownedEntities: ["EntityType","EntityRecord","EntitySchema","EntityField","EntityRelationship","EntityLifecycle","EntityValidation","EntityIndex"] }, metadata: { source: "planning", toolsCatalog: "entityos-tools.md" } }
  ], runs: [], events: [{ id: newId("event"), tenantId, createdAt: now, updatedAt: now, type: "entity.seeded", source: "EntityOS", itemId: firstId, payload: { items: 2 } }], auditLogs: [] };
}
