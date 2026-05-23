export function docs() {
  return {
    name: "ConfigOS",
    version: "1.0.0",
    description: "Runtime configuration, tenant settings, feature flags, environment config, and OS-level settings management for APPNEURAL ecosystem.",
    auth: {
      headers: {
        "x-role": "owner | admin | config_admin | config_manager | config_viewer | tenant_admin | auditor",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      config: "A key-value configuration entry with versioning, environment scope, and approval workflow support.",
      featureFlag: "A toggle to enable/disable features with rollout strategies (percentage, tenant, role, plan-based).",
      environmentConfig: "Environment-specific configuration collections (local, development, staging, production, etc.).",
      tenantSetting: "Tenant-specific settings that can override global defaults.",
      runtimeOverride: "Temporary runtime overrides for behavior changes without deployment.",
      configResolution: "Config values are resolved with precedence: runtime override > tenant setting > environment config > global config"
    },
    examples: {
      createConfig: {
        method: "POST",
        path: "/configos/configs",
        headers: { "x-role": "config_admin" },
        body: {
          key: "platform.max_upload_size_mb",
          name: "Maximum Upload Size",
          value: 25,
          environment: "global",
          scope: "global",
          tags: ["platform", "upload"]
        }
      },
      createFeatureFlag: {
        method: "POST",
        path: "/configos/feature-flags",
        headers: { "x-role": "config_admin" },
        body: {
          key: "enable_new_dashboard",
          name: "New Dashboard",
          description: "Enable the new beta dashboard",
          enabled: false,
          environment: "staging",
          rolloutPercentage: 10,
          tags: ["dashboard", "beta"]
        }
      },
      toggleFeatureFlag: {
        method: "POST",
        path: "/configos/feature-flags/:id/toggle",
        headers: { "x-role": "config_admin" },
        body: {}
      },
      checkFeatureEnabled: {
        method: "GET",
        path: "/configos/feature-flags/check/enable_new_dashboard?tenantId=abc-institute&userRole=admin",
        headers: { "x-role": "viewer" }
      },
      resolveConfig: {
        method: "GET",
        path: "/configos/configs/resolve?key=platform.default_timezone&environment=production&tenantId=abc-institute",
        headers: { "x-role": "viewer" }
      },
      createTenantSetting: {
        method: "POST",
        path: "/configos/tenants",
        headers: { "x-role": "tenant_admin" },
        body: {
          tenantId: "abc-institute",
          key: "branding.primary_color",
          name: "Primary Brand Color",
          value: "#5289F2",
          category: "branding"
        }
      },
      createEnvironmentConfig: {
        method: "POST",
        path: "/configos/environments",
        headers: { "x-role": "config_admin" },
        body: {
          key: "production_ai_config",
          name: "Production AI Configuration",
          environment: "production",
          values: {
            ai_model: "gpt-4",
            timeout_ms: 30000,
            rate_limit_per_minute: 1000
          }
        }
      },
      createRuntimeOverride: {
        method: "POST",
        path: "/configos/runtime-overrides",
        headers: { "x-role": "config_admin" },
        body: {
          key: "ai.timeout.override",
          name: "AI Timeout Override",
          target: "ai.model.timeout",
          value: 60000,
          environment: "production",
          priority: 10,
          expiresAt: "2026-12-31T23:59:59Z"
        }
      },
      rollbackConfig: {
        method: "POST",
        path: "/configos/configs/:id/rollback",
        headers: { "x-role": "config_admin" },
        body: {
          version: 2
        }
      }
    },
    environments: [
      "local",
      "development",
      "staging",
      "preview",
      "production",
      "sandbox",
      "enterprise-isolated",
      "demo",
      "test"
    ],
    scopes: ["global", "module", "tenant", "user"],
    configStatuses: ["draft", "pending_approval", "approved", "published", "rolled_back", "deprecated"],
    tenantCategories: ["branding", "feature", "billing", "notification", "security", "integration", "custom"],
    useCases: [
      "Centralized configuration management across all APPNEURAL modules",
      "Feature flag rollout with gradual percentage and tenant targeting",
      "Environment-specific configuration (local, dev, staging, production)",
      "Tenant-specific settings with override capabilities",
      "Runtime behavior overrides without code deployment",
      "Config versioning and rollback for safe changes",
      "Approval workflows for sensitive production configs"
    ]
  };
}
