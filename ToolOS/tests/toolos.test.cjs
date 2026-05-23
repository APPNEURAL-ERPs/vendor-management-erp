const test = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const { unlinkSync } = require("node:fs");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { spawnSync } = require("node:child_process");

const { DataStore } = require("../dist/core/datastore.js");
const { EventBus } = require("../dist/core/event-bus.js");
const { ToolService } = require("../dist/services/tool.service.js");
const { createSeedState } = require("../dist/seed-state.js");
const { validateToolManifest } = require("../dist/manifest/tool-manifest.js");
const { ToolPackageGenerator } = require("../dist/generator/tool-package-generator.js");

const validManifest = {
  id: "tool.demo.echo",
  name: "Echo Tool",
  packageName: "@appneurox/tool-demo-echo",
  version: "1.0.0",
  category: "utility",
  type: "core",
  aiSupport: {
    enabled: true,
    toolName: "echo",
    description: "Echoes structured input for agent tests."
  },
  inputSchema: { message: "string" },
  outputSchema: { message: "string" },
  commands: ["tool.demo.echo.run"],
  permissions: ["tools.demo.echo"],
  events: {
    publishes: ["tool.demo.echo.completed"],
    subscribes: []
  },
  api: { route: "/v1/tools/tool.demo.echo/execute" },
  sdk: { namespace: "tools.demo.echo" },
  cli: { namespace: "tool-demo-echo" },
  dependencies: {
    required: ["@appneurox/toolos"],
    optional: ["@appneurox/agenticos"]
  },
  safety: {
    riskLevel: "low",
    requiresApproval: false,
    rules: ["no_sensitive_data"]
  },
  usedBy: ["AgenticOS", "DeveloperOS"]
};

function createService() {
  const file = join("/tmp", `toolos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState("demo-tenant"));
  const service = new ToolService(store, new EventBus(store));
  const actor = { tenantId: "demo-tenant", userId: "test-user", role: "tool_admin" };
  return { service, actor, file };
}

function cleanup(file) {
  try { unlinkSync(file); } catch {}
}

test("ToolOS overview and registry use seed tools", () => {
  const { service, actor, file } = createService();
  try {
    const overview = service.overview(actor);
    assert.equal(overview.counts.tools, 4);
    assert.equal(overview.counts.activeTools, 4);
    assert.ok(service.listTools(actor).some((tool) => tool.key === "tool.qr.generate"));
  } finally {
    cleanup(file);
  }
});

test("ToolOS creates and executes QR, PDF, domain, and brand tools", () => {
  const { service, actor, file } = createService();
  try {
    const custom = service.createTool(actor, {
      key: "tool.slug.generate",
      name: "Slug Generator",
      kind: "generator",
      category: "text",
      requiredPermissions: ["tools.slug.generate"]
    });
    assert.equal(custom.key, "tool.slug.generate");

    const qr = service.executeTool(actor, "tool.qr.generate", { text: "upi://pay?pa=demo@appneurox" });
    assert.equal(qr.status, "succeeded");
    assert.equal(qr.output.format, "png");

    const pdf = service.executeTool(actor, "tool.pdf.generate", { template: "invoice" });
    assert.equal(pdf.output.pages, 1);

    const domain = service.executeTool(actor, "tool.domain.check", { domain: "taken.example" });
    assert.equal(domain.output.available, false);

    const brand = service.executeTool(actor, "tool.brand.check", { text: "This is risk-free and guaranteed." });
    assert.equal(brand.output.compliant, false);
    assert.ok(brand.output.bannedClaims.includes("guaranteed"));
  } finally {
    cleanup(file);
  }
});

test("ToolOS denies tool execution without required permissions", () => {
  const { service, file } = createService();
  try {
    const viewer = { tenantId: "demo-tenant", userId: "viewer", role: "viewer" };
    assert.throws(() => service.executeTool(viewer, "tool.qr.generate", { text: "x" }), /execute tools/);
  } finally {
    cleanup(file);
  }
});

test("ToolOS approval gates high-risk tools", () => {
  const { service, actor, file } = createService();
  try {
    service.createTool(actor, {
      key: "tool.email.send",
      name: "Email Sender",
      kind: "connector",
      category: "communication",
      riskLevel: "critical",
      requiredPermissions: ["tools.email.send"],
      requiresApproval: true
    });
    const execution = service.executeTool(actor, "tool.email.send", { to: "demo@example.com", body: "hello" });
    assert.equal(execution.status, "blocked");
    assert.ok(execution.approvalId);
    assert.equal(service.overview(actor).counts.pendingApprovals, 1);
    const approved = service.approve(actor, execution.approvalId, "Approved for test");
    assert.equal(approved.status, "approved");
  } finally {
    cleanup(file);
  }
});

test("ToolOS policies, credentials, events, and audit logs work", () => {
  const { service, actor, file } = createService();
  try {
    const policy = service.createPolicy(actor, {
      toolKey: "tool.qr.generate",
      allowedRoles: ["tool_operator"],
      maxCallsPerRun: 5
    });
    assert.equal(policy.toolKey, "tool.qr.generate");

    const credential = service.createCredential(actor, {
      toolKey: "tool.domain.check",
      key: "domain-provider",
      label: "Domain Provider API",
      value: "secret-value"
    });
    assert.notEqual(credential.maskedValue, "secret-value");

    service.executeTool(actor, "tool.qr.generate", { text: "hello" });
    assert.ok(service.listEvents(actor).some((event) => event.type === "tool.execution.completed"));
    assert.ok(service.auditLogs(actor).some((log) => log.action === "tool.execution.run"));
  } finally {
    cleanup(file);
  }
});

test("ToolOS validates good manifests and rejects bad manifests", () => {
  const good = validateToolManifest(validManifest);
  assert.equal(good.valid, true);
  assert.equal(good.manifest.id, "tool.demo.echo");

  const bad = validateToolManifest({
    ...validManifest,
    packageName: "@wrong/tool-demo-echo",
    api: { route: "/bad/path" },
    permissions: []
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.some((error) => error.includes("@appneurox")));
  assert.ok(bad.errors.some((error) => error.includes("/v1/tools/")));
  assert.ok(bad.errors.some((error) => error.includes("permissions")));
});

test("ToolOS installs manifests, tracks analytics, and discovers installed tools", () => {
  const { service, actor, file } = createService();
  try {
    const installation = service.installManifest(actor, validManifest);
    assert.equal(installation.status, "installed");
    assert.equal(installation.packageName, "@appneurox/tool-demo-echo");
    assert.ok(service.discoverTools(actor).some((item) => item.manifestId === "tool.demo.echo"));

    const execution = service.executeTool(actor, "tool.demo.echo", { message: "hello" });
    assert.equal(execution.status, "succeeded");
    const analytics = service.usageAnalytics(actor);
    assert.equal(analytics.totalCalls, 1);
    assert.equal(analytics.byTool["tool.demo.echo"].calls, 1);
  } finally {
    cleanup(file);
  }
});

test("Tool package generator creates a package that builds and tests", () => {
  const outputDir = mkdtempSync(join(tmpdir(), "toolos-generator-"));
  try {
    const generated = new ToolPackageGenerator().generate(validManifest, outputDir);
    assert.ok(generated.files.includes("manifest.json"));
    assert.ok(generated.files.includes("src/core/index.ts"));
    assert.ok(generated.files.includes("tests/unit.test.cjs"));
    assert.ok(generated.files.includes("tests/manifest.test.cjs"));
    assert.ok(generated.files.includes("tests/e2e.test.cjs"));

    const install = spawnSync("npm", ["install", "--silent"], { cwd: generated.rootDir, encoding: "utf8" });
    assert.equal(install.status, 0, install.stderr || install.stdout);

    const testRun = spawnSync("npm", ["test", "--silent"], { cwd: generated.rootDir, encoding: "utf8" });
    assert.equal(testRun.status, 0, testRun.stderr || testRun.stdout);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
});
