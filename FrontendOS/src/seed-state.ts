import { FrontendState } from "./domain";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): FrontendState {
  const now = nowIso(); const firstId = newId("frontend"); const secondId = newId("frontend");
  return { items: [
    { id: firstId, tenantId, createdAt: now, updatedAt: now, key: "frontend-registry", name: "Frontend Registry", description: "Starter registry item for FrontendOS.", type: "FrontendApp", status: "active", ownerId: "system", tags: ["starter", "registry"], attributes: { purpose: "Frontend architecture, app shells, design systems, components, pages, layouts, routing, state, forms, accessibility, performance, and app experience." }, metadata: { source: "planning", toolsCatalog: "frontendos-tools.md" } },
    { id: secondId, tenantId, createdAt: now, updatedAt: now, key: "frontend-lifecycle", name: "Frontend Lifecycle", description: "Starter lifecycle item for FrontendOS operations.", type: "AppShell", status: "pending_review", ownerId: "system", tags: ["starter", "lifecycle"], attributes: { ownedEntities: ["FrontendApp","AppShell","Page","Route","Component","Layout","Theme","Form","AccessibilityCheck"] }, metadata: { source: "planning", toolsCatalog: "frontendos-tools.md" } }
  ], runs: [], events: [{ id: newId("event"), tenantId, createdAt: now, updatedAt: now, type: "frontend.seeded", source: "FrontendOS", itemId: firstId, payload: { items: 2 } }], auditLogs: [] };
}
