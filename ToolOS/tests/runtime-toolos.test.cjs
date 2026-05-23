const test = require("node:test");
const assert = require("node:assert/strict");

const { ToolOS } = require("../dist/index.js");

const qrManifest = {
  id: "tool.qr.generate",
  name: "QR Generator",
  packageName: "@appneurox/tool-qr-generator",
  version: "1.0.0",
  category: "media",
  type: "core",
  aiSupport: {
    enabled: true,
    toolName: "qr_generator",
    description: "Generates QR codes for URLs, payment links, and short text."
  },
  inputSchema: {
    text: "string",
    format: "string?"
  },
  outputSchema: {
    fileUrl: "string",
    format: "string"
  },
  commands: ["tool.qr.generate"],
  permissions: ["tools.qr.generate"],
  events: {
    publishes: ["tool.qr.generated"],
    subscribes: []
  },
  api: {
    route: "/v1/tools/tool.qr.generate/execute"
  },
  sdk: {
    namespace: "tools.qr"
  },
  cli: {
    namespace: "tool qr"
  },
  dependencies: {
    required: ["@appneurox/toolos"],
    optional: ["@appneurox/agenticos", "@appneurox/aios"]
  },
  safety: {
    riskLevel: "low",
    requiresApproval: false,
    rules: ["no_secret_payloads"]
  },
  usedBy: ["AgenticOS", "CommandOS", "DeveloperOS", "AIOS"]
};

function context(permissions = ["tools.qr.generate"]) {
  return {
    tenantId: "demo-tenant",
    userId: "user-001",
    permissions
  };
}

test("register valid tool", () => {
  const toolos = new ToolOS();
  const tool = toolos.registerTool(qrManifest);
  assert.equal(tool.id, "tool.qr.generate");
  assert.equal(tool.packageName, "@appneurox/tool-qr-generator");
});

test("reject invalid tool", () => {
  const toolos = new ToolOS();
  const invalid = { ...qrManifest, packageName: "bad-scope", permissions: [] };
  assert.throws(() => toolos.registerTool(invalid), /Invalid tool manifest/);
});

test("list tools and get by id/category/AI support", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrManifest);
  assert.equal(toolos.listTools().length, 1);
  assert.equal(toolos.getTool("tool.qr.generate").name, "QR Generator");
  assert.equal(toolos.getToolsByCategory("media").length, 1);
  assert.equal(toolos.getAIEnabledTools().length, 1);
});

test("execute tool", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrManifest);
  const result = toolos.executeTool("tool.qr.generate", { text: "https://appneurox.com", format: "png" }, context());
  assert.equal(result.status, "succeeded");
  assert.equal(result.output.format, "png");
  assert.match(result.output.fileUrl, /^tool:\/\/qr\//);
});

test("enforce permission", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrManifest);
  assert.throws(() => {
    toolos.executeTool("tool.qr.generate", { text: "x" }, context([]));
  }, /Permission denied/);
});

test("track event and analytics", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrManifest);
  toolos.executeTool("tool.qr.generate", { text: "hello" }, context());
  assert.equal(toolos.analytics.events.length, 1);
  assert.equal(toolos.analytics.events[0].type, "tool.execution.completed");
  assert.equal(toolos.analytics.metrics.length, 1);
  assert.equal(toolos.analytics.metrics[0].toolId, "tool.qr.generate");
});

test("reject unknown command", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrManifest);
  assert.throws(() => {
    toolos.executeTool("tool.unknown.run", { text: "x" }, context());
  }, /Unknown tool command/);
});

test("expose DeveloperOS metadata", () => {
  const toolos = new ToolOS();
  toolos.installTool(qrManifest);
  const metadata = toolos.getDeveloperMetadata();
  assert.equal(metadata[0].apiRoute, "/v1/tools/tool.qr.generate/execute");
  assert.equal(metadata[0].sdkNamespace, "tools.qr");
  assert.equal(metadata[0].aiEnabled, true);
});
