export function buildDocs(routes: Array<{ method: string; path: string; permission?: string }>): unknown {
  return {
    os: "ProductOS",
    version: "1.0.0",
    description: "Reusable product lifecycle OS for products, versions, roadmap, requirements, features, backlog, releases, BOM, components, change requests, analytics, events, and audit logs.",
    auth: {
      tenantHeader: "x-tenant-id",
      userHeader: "x-user-id",
      roleHeader: "x-role",
      demoTenant: "demo-tenant"
    },
    roles: ["viewer", "product_manager", "product_owner", "roadmap_planner", "release_manager", "bom_manager", "product_admin", "admin", "owner", "auditor"],
    examples: {
      createProduct: { method: "POST", path: "/productos/products", role: "product_admin", body: { productCode: "PROD-APPNEUROX", name: "AppneuroX", type: "software", ownerId: "pm_001", market: "AI Platforms" } },
      createRequirement: { method: "POST", path: "/productos/requirements", role: "product_owner", body: { productId: "prod_appneurox", title: "AI workspace", description: "Users need a unified AI agent workspace.", source: "customer", priority: "high" } },
      createRelease: { method: "POST", path: "/productos/releases", role: "release_manager", body: { productId: "prod_appneurox", name: "AppneuroX 1.1", plannedDate: "2026-07-15", featureIds: ["feat_ai_workspace"] } }
    },
    routes
  };
}
