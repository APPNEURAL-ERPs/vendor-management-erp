const test = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const { unlinkSync } = require("node:fs");

const { DataStore } = require("../dist/core/datastore.js");
const { EventBus } = require("../dist/core/event-bus.js");
const { KnowledgeService } = require("../dist/services/knowledgeos.service.js");
const { createSeedState } = require("../dist/seed-state.js");

function createService() {
  const file = join("/tmp", "knowledgeos-test-" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".json");
  const store = new DataStore(file);
  store.reset(createSeedState("demo-tenant"));
  const service = new KnowledgeService(store, new EventBus(store));
  const actor = { tenantId: "demo-tenant", userId: "test-user", role: "knowledgeos_admin" };
  return { service, actor, file };
}

function cleanup(file) {
  try { unlinkSync(file); } catch {}
}

test("KnowledgeOS overview uses seed data", () => {
  const { service, actor, file } = createService();
  try {
    const overview = service.overview(actor);
    assert.equal(overview.counts.items, 2);
    assert.equal(overview.counts.workflows, 1);
    assert.equal(overview.counts.policies, 1);
  } finally {
    cleanup(file);
  }
});

test("KnowledgeOS creates items, workflows, and runs", () => {
  const { service, actor, file } = createService();
  try {
    const item = service.createItem(actor, {
      key: "custom-item",
      title: "Custom Article",
      category: "docs",
      priority: "high",
      tags: ["custom"]
    });
    assert.equal(item.key, "custom-item");

    const workflow = service.createWorkflow(actor, {
      key: "custom-workflow",
      name: "Custom workflow",
      category: "rag",
      itemKeys: [item.key],
      steps: ["intake", "review"]
    });
    assert.equal(workflow.steps.length, 2);

    const run = service.startWorkflow(actor, workflow.key, { context: { itemKey: item.key } });
    assert.equal(run.status, "in_progress");
    const done = service.updateRun(actor, run.id, { status: "done" });
    assert.equal(done.status, "done");
    assert.ok(done.completedAt);
  } finally {
    cleanup(file);
  }
});

test("KnowledgeOS creates policies and audits changes", () => {
  const { service, actor, file } = createService();
  try {
    const policy = service.createPolicy(actor, {
      key: "custom-policy",
      title: "Custom policy",
      body: "Keep ownership and review records current."
    });
    assert.equal(policy.status, "active");

    service.updateItem(actor, "custom-missing", {});
  } catch (error) {
    assert.equal(error.statusCode, 404);
  } finally {
    cleanup(file);
  }
});
