const test = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const { unlinkSync } = require("node:fs");

const { DataStore } = require("../dist/core/datastore.js");
const { EventBus } = require("../dist/core/event-bus.js");
const { BusinessService } = require("../dist/services/business.service.js");
const { createSeedState } = require("../dist/seed-state.js");

function createService() {
  const file = join("/tmp", `businessos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState("demo-tenant"));
  const service = new BusinessService(store, new EventBus(store));
  const actor = { tenantId: "demo-tenant", userId: "test-user", role: "business_admin" };
  return { service, store, actor, file };
}

function cleanup(file) {
  try { unlinkSync(file); } catch {}
}

test("BusinessOS overview and hierarchy use seed data", () => {
  const { service, actor, file } = createService();
  try {
    const overview = service.overview(actor);
    assert.equal(overview.counts.branches, 2);
    assert.equal(overview.counts.departments, 3);
    assert.equal(overview.organization.displayName, "Appneural");

    const hierarchy = service.hierarchy(actor);
    assert.equal(hierarchy.branches.length, 2);
    assert.ok(hierarchy.branches[0].departments.length >= 1);
  } finally {
    cleanup(file);
  }
});

test("BusinessOS creates branch, department, and team", () => {
  const { service, actor, file } = createService();
  try {
    const branch = service.createBranch(actor, {
      name: "Mumbai Branch",
      code: "MUM-001",
      type: "branch",
      address: { city: "Mumbai", country: "India" }
    });
    assert.equal(branch.code, "MUM-001");

    const department = service.createDepartment(actor, {
      name: "Customer Success",
      code: "CS",
      branchIds: [branch.id],
      costCenter: "CC-CS"
    });
    assert.equal(department.branchIds[0], branch.id);

    const team = service.createTeam(actor, {
      name: "Enterprise Success",
      code: "ENT-SUCCESS",
      departmentId: department.id,
      branchId: branch.id,
      memberUserIds: ["u1", "u2", "u1"]
    });
    assert.equal(team.memberUserIds.length, 2);
  } finally {
    cleanup(file);
  }
});

test("BusinessOS settings mask secrets for viewer but not config manager", () => {
  const { service, actor, file } = createService();
  try {
    const secret = service.createSetting(actor, {
      key: "payments.gatewaySecret",
      label: "Gateway Secret",
      category: "payments",
      value: "super-secret",
      dataType: "string",
      isSecret: true
    });
    assert.equal(secret.value, "super-secret");

    const viewer = { tenantId: "demo-tenant", userId: "viewer", role: "viewer" };
    const masked = service.getSetting(viewer, "payments.gatewaySecret");
    assert.equal(masked.value, "********");

    const configManager = { tenantId: "demo-tenant", userId: "cfg", role: "config_manager" };
    const visible = service.getSetting(configManager, "payments.gatewaySecret");
    assert.equal(visible.value, "super-secret");
  } finally {
    cleanup(file);
  }
});

test("BusinessOS feature flags, policies, onboarding, and config validation work", () => {
  const { service, actor, file } = createService();
  try {
    const flag = service.createFeatureFlag(actor, {
      key: "beta_business_home",
      enabled: false,
      rolloutPercentage: 10,
      audience: ["admin"]
    });
    assert.equal(flag.enabled, false);
    const toggled = service.toggleFeatureFlag(actor, "beta_business_home", true);
    assert.equal(toggled.enabled, true);

    const policy = service.createPolicy(actor, {
      title: "Expense Approval Policy",
      category: "finance",
      body: "All expenses above 5000 require approval.",
      requiresAcknowledgement: true
    });
    const published = service.publishPolicy(actor, policy.id);
    assert.equal(published.status, "published");
    assert.ok(published.publishedAt);

    const task = service.createOnboardingTask(actor, {
      key: "connect_financeos",
      title: "Connect FinanceOS",
      category: "integrations"
    });
    const completed = service.updateOnboardingStatus(actor, task.id, "done");
    assert.equal(completed.status, "done");
    assert.ok(completed.completedAt);

    const validation = service.validateConfig(actor);
    assert.equal(Array.isArray(validation.issues), true);
  } finally {
    cleanup(file);
  }
});
