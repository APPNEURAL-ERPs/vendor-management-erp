export function docs() {
  return {
    service: "PlatformOS",
    version: "1.0.0",
    description: "Reusable platform operating layer for platform profile, OS registry, environments, deployments, integrations, feature flags, releases, health checks, events, permissions, and audit logs.",
    defaultTenant: "demo-tenant",
    headers: {
      tenant: "x-tenant-id",
      role: "x-role",
      user: "x-user-id"
    },
    roles: ["owner", "admin", "platform_admin", "architect", "ops_manager", "integration_manager", "auditor", "viewer"],
    endpoints: {
      overview: ["GET /platformos/overview", "GET /platformos/permissions"],
      profile: ["GET /platformos/profile", "PUT /platformos/profile"],
      services: ["GET /platformos/services", "POST /platformos/services", "PUT /platformos/services/:key", "DELETE /platformos/services/:key"],
      catalog: ["GET /platformos/catalog", "POST /platformos/catalog/ingest"],
      environments: ["GET /platformos/environments", "POST /platformos/environments"],
      deployments: ["GET /platformos/deployments", "POST /platformos/deployments", "PATCH /platformos/deployments/:id/status"],
      integrations: ["GET /platformos/integrations", "POST /platformos/integrations"],
      featureFlags: ["GET /platformos/feature-flags", "POST /platformos/feature-flags", "PATCH /platformos/feature-flags/:key/toggle"],
      releases: ["GET /platformos/releases", "POST /platformos/releases", "PATCH /platformos/releases/:key/status"],
      health: ["GET /platformos/health-checks", "POST /platformos/health-checks"],
      logs: ["GET /platformos/events", "GET /platformos/audit"]
    }
  };
}
