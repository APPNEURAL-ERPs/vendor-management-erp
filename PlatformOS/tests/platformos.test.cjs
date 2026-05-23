const test = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const { unlinkSync } = require("node:fs");

const { DataStore } = require("../dist/core/datastore.js");
const { EventBus } = require("../dist/core/event-bus.js");
const { PlatformService } = require("../dist/services/platform.service.js");
const { createSeedState } = require("../dist/seed-state.js");

function createService() {
  const file = join("/tmp", `platformos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState("demo-tenant"));
  const service = new PlatformService(store, new EventBus(store));
  const actor = { tenantId: "demo-tenant", userId: "test-user", role: "platform_admin" };
  return { service, actor, file };
}

function cleanup(file) {
  try { unlinkSync(file); } catch {}
}

test("PlatformOS overview uses seed data", () => {
  const { service, actor, file } = createService();
  try {
    const overview = service.overview(actor);
    assert.equal(overview.counts.services, 3);
    assert.equal(overview.counts.environments, 2);
    assert.equal(overview.counts.unhealthyServices, 1);
    assert.equal(overview.profile.slug, "appneural-platform");
  } finally {
    cleanup(file);
  }
});

test("PlatformOS creates services, environments, and integrations", () => {
  const { service, actor, file } = createService();
  try {
    const analytics = service.createService(actor, {
      key: "analyticsos",
      name: "AnalyticsOS",
      category: "intelligence",
      ownerTeam: "Analytics",
      capabilities: ["metrics", "reports"],
      health: "healthy"
    });
    assert.equal(analytics.key, "analyticsos");

    const environment = service.createEnvironment(actor, {
      key: "qa",
      name: "QA",
      type: "test",
      region: "central-india"
    });
    assert.equal(environment.type, "test");

    const integration = service.createIntegration(actor, {
      key: "analytics-command",
      name: "Analytics alerts to CommandOS",
      sourceServiceKey: "analyticsos",
      targetServiceKey: "commandos",
      eventTypes: ["analytics.metric.anomaly"],
      contractVersion: "1.0.0"
    });
    assert.equal(integration.status, "active");
  } finally {
    cleanup(file);
  }
});

test("PlatformOS tracks deployments and releases", () => {
  const { service, actor, file } = createService();
  try {
    const deployment = service.createDeployment(actor, {
      serviceKey: "commandos",
      environmentKey: "prod",
      version: "1.0.1",
      status: "deploying",
      commitSha: "abc123"
    });
    assert.equal(deployment.status, "deploying");

    const completed = service.updateDeploymentStatus(actor, deployment.id, { status: "succeeded", notes: "healthy" });
    assert.equal(completed.status, "succeeded");
    assert.ok(completed.completedAt);

    const release = service.createRelease(actor, {
      key: "ops-1.0.1",
      title: "Operations release",
      version: "1.0.1",
      serviceKeys: ["commandos"],
      environmentKey: "prod",
      status: "scheduled"
    });
    const released = service.updateReleaseStatus(actor, release.key, { status: "released" });
    assert.equal(released.status, "released");
    assert.ok(released.releasedAt);
  } finally {
    cleanup(file);
  }
});

test("PlatformOS feature flags and health checks work", () => {
  const { service, actor, file } = createService();
  try {
    const flag = service.createFeatureFlag(actor, {
      key: "new-dashboard",
      name: "New dashboard",
      environmentKeys: ["prod"],
      rolloutPercentage: 25
    });
    assert.equal(flag.enabled, false);

    const toggled = service.toggleFeatureFlag(actor, flag.key, true);
    assert.equal(toggled.enabled, true);

    const health = service.recordHealthCheck(actor, {
      serviceKey: "commerceos",
      environmentKey: "prod",
      status: "healthy",
      latencyMs: 120,
      message: "Recovered"
    });
    assert.equal(health.status, "healthy");
    assert.equal(service.overview(actor).counts.unhealthyServices, 0);
  } finally {
    cleanup(file);
  }
});
