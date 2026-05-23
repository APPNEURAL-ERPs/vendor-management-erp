const test = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const { unlinkSync } = require("node:fs");

const { DataStore } = require("../dist/core/datastore.js");
const { EventBus } = require("../dist/core/event-bus.js");
const { CommandService } = require("../dist/services/command.service.js");
const { createSeedState } = require("../dist/seed-state.js");

function createService() {
  const file = join("/tmp", `commandos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState("demo-tenant"));
  const service = new CommandService(store, new EventBus(store));
  const actor = { tenantId: "demo-tenant", userId: "test-user", role: "command_admin" };
  return { service, store, actor, file };
}

function cleanup(file) {
  try { unlinkSync(file); } catch {}
}

test("CommandOS overview uses seed data", () => {
  const { service, actor, file } = createService();
  try {
    const overview = service.overview(actor);
    assert.equal(overview.counts.commands, 3);
    assert.equal(overview.counts.runbooks, 1);
    assert.equal(overview.counts.enabledAutomationRules, 1);
    assert.equal(overview.openIncidents[0].key, "INC-1001");
  } finally {
    cleanup(file);
  }
});

test("CommandOS creates and executes commands", () => {
  const { service, actor, file } = createService();
  try {
    const command = service.createCommand(actor, {
      key: "analytics.rebuild-rollup",
      name: "Rebuild analytics rollup",
      category: "analytics",
      priority: "high",
      requiredRole: "operator",
      inputSchema: { window: "string" }
    });
    assert.equal(command.key, "analytics.rebuild-rollup");

    const execution = service.executeCommand(actor, command.key, { window: "24h" });
    assert.equal(execution.status, "queued");
    assert.equal(execution.commandKey, command.key);

    const running = service.updateExecutionStatus(actor, execution.id, { status: "running" });
    assert.equal(running.status, "running");
    assert.ok(running.startedAt);

    const completed = service.updateExecutionStatus(actor, execution.id, { status: "succeeded", output: { rebuilt: true } });
    assert.equal(completed.status, "succeeded");
    assert.equal(completed.output.rebuilt, true);
  } finally {
    cleanup(file);
  }
});

test("CommandOS starts runbooks and advances steps", () => {
  const { service, actor, file } = createService();
  try {
    const run = service.startRunbook(actor, "incident.checkout-degradation", { context: { incidentId: "inc_1" } });
    assert.equal(run.status, "running");
    assert.equal(run.steps[0].status, "running");

    const advanced = service.updateRunbookStep(actor, run.id, run.steps[0].id, { status: "completed", note: "Metrics confirmed" });
    assert.equal(advanced.steps[0].status, "completed");
    assert.equal(advanced.steps[1].status, "running");
  } finally {
    cleanup(file);
  }
});

test("CommandOS automation, schedules, and incidents work", () => {
  const { service, actor, file } = createService();
  try {
    const triggered = service.triggerAutomation(actor, "checkout-error-rate-runbook");
    assert.equal(triggered.runbookKey, "incident.checkout-degradation");

    const schedule = service.createSchedule(actor, {
      key: "daily-freeze-drill",
      name: "Daily signup freeze drill",
      cadence: "daily",
      commandId: "cmd_freeze_signups",
      input: { durationMinutes: 5, reason: "drill" }
    });
    assert.equal(schedule.enabled, true);

    const incident = service.openIncident(actor, {
      key: "INC-1002",
      title: "API failures elevated",
      severity: "sev2",
      summary: "Partner API failures crossed threshold."
    });
    const updated = service.updateIncident(actor, incident.key, { status: "resolved", note: "Recovered after rollback" });
    assert.equal(updated.status, "resolved");
    assert.ok(updated.resolvedAt);
    assert.equal(updated.timeline[0].message, "Recovered after rollback");
  } finally {
    cleanup(file);
  }
});
