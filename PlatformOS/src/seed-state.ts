import { PlatformState } from "./core/domain";

export function createSeedState(tenantId = "demo-tenant"): PlatformState {
  const now = new Date().toISOString();
  return {
    profiles: [
      {
        id: "platform_appneural",
        tenantId,
        createdAt: now,
        updatedAt: now,
        name: "Appneural Platform",
        slug: "appneural-platform",
        description: "Unified operating platform for Appneural OS services.",
        region: "central-india",
        primaryDomain: "appneural.example",
        ownerTeam: "Platform",
        status: "active",
        metadata: { tier: "demo" },
        updatedBy: "seed"
      }
    ],
    services: [
      {
        id: "svc_businessos",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "businessos",
        name: "BusinessOS",
        description: "Organization, settings, and admin operating layer.",
        category: "core",
        ownerTeam: "Platform",
        baseUrl: "http://localhost:4400",
        version: "1.0.0",
        status: "active",
        health: "healthy",
        dependencies: [],
        capabilities: ["organization", "settings", "feature-flags"],
        tags: ["core", "admin"],
        metadata: {},
        updatedBy: "seed"
      },
      {
        id: "svc_commandos",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "commandos",
        name: "CommandOS",
        description: "Command center, runbooks, automation, and incident response.",
        category: "operations",
        ownerTeam: "Platform Operations",
        baseUrl: "http://localhost:4900",
        version: "1.0.0",
        status: "active",
        health: "healthy",
        dependencies: ["businessos", "securityos"],
        capabilities: ["commands", "runbooks", "incidents"],
        tags: ["ops", "automation"],
        metadata: {},
        updatedBy: "seed"
      },
      {
        id: "svc_commerceos",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "commerceos",
        name: "CommerceOS",
        description: "Products, checkout, orders, inventory, and POS.",
        category: "business",
        ownerTeam: "Commerce",
        baseUrl: "http://localhost:4000",
        version: "1.0.0",
        status: "active",
        health: "degraded",
        dependencies: ["businessos", "financeos"],
        capabilities: ["products", "checkout", "orders"],
        tags: ["commerce"],
        metadata: { degradedReason: "checkout p95 elevated" },
        updatedBy: "seed"
      }
    ],
    environments: [
      {
        id: "env_dev",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "dev",
        name: "Development",
        type: "dev",
        region: "central-india",
        domain: "dev.appneural.example",
        status: "active",
        variables: { logLevel: "debug" },
        updatedBy: "seed"
      },
      {
        id: "env_prod",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "prod",
        name: "Production",
        type: "prod",
        region: "central-india",
        domain: "appneural.example",
        status: "active",
        variables: { logLevel: "info" },
        updatedBy: "seed"
      }
    ],
    deployments: [
      {
        id: "dep_commandos_100",
        tenantId,
        createdAt: now,
        updatedAt: now,
        serviceKey: "commandos",
        environmentKey: "prod",
        version: "1.0.0",
        status: "succeeded",
        commitSha: "demo-commandos",
        startedAt: now,
        completedAt: now,
        deployedBy: "seed",
        notes: "Initial CommandOS deployment"
      }
    ],
    integrations: [
      {
        id: "int_commerce_command",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "commerceos-to-commandos",
        name: "Commerce alerts to CommandOS",
        sourceServiceKey: "commerceos",
        targetServiceKey: "commandos",
        eventTypes: ["commerce.checkout.error_rate.high", "commerce.order.backlog.high"],
        status: "active",
        contractVersion: "1.0.0",
        metadata: { delivery: "event-bus" },
        updatedBy: "seed"
      }
    ],
    featureFlags: [
      {
        id: "flag_platform_control_plane",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "platform-control-plane",
        name: "Platform control plane",
        description: "Enables unified platform dashboard features.",
        enabled: true,
        rolloutPercentage: 100,
        environmentKeys: ["dev", "prod"],
        ownerTeam: "Platform",
        status: "active",
        updatedBy: "seed"
      }
    ],
    releases: [
      {
        id: "rel_foundation_100",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "foundation-1.0.0",
        title: "Foundation OS release",
        version: "1.0.0",
        status: "released",
        serviceKeys: ["businessos", "commandos", "commerceos"],
        environmentKey: "prod",
        releasedAt: now,
        notes: "Initial platform foundation release.",
        createdBy: "seed",
        updatedBy: "seed"
      }
    ],
    healthChecks: [
      {
        id: "health_commerce_prod",
        tenantId,
        createdAt: now,
        updatedAt: now,
        serviceKey: "commerceos",
        environmentKey: "prod",
        status: "degraded",
        latencyMs: 850,
        message: "Checkout latency above target",
        checkedAt: now
      }
    ],
    events: [
      {
        id: "evt_seed_ready",
        tenantId,
        createdAt: now,
        updatedAt: now,
        type: "platformos.seed.ready",
        source: "PlatformOS",
        actorId: "seed",
        role: "platform_admin",
        data: { services: 3, environments: 2 }
      }
    ],
    auditLogs: []
  };
}
