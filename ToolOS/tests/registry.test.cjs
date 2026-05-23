const test = require("node:test");
const assert = require("node:assert/strict");

const { ToolOS } = require("../dist/index.js");

const manifest = {
  id: "tool.qr.generate",
  name: "QR Generator",
  packageName: "@appneurox/tool-qr-generator",
  version: "1.0.0",
  category: "media",
  type: "core",
  ai: { enabled: true, toolName: "qr_generator" },
  commands: ["tool.qr.generate"],
  permissions: ["tools.qr.generate"],
  events: { publishes: ["tool.qr.generated"], subscribes: [] },
  api: { route: "/v1/tools/tool.qr.generate/execute" },
  sdk: { namespace: "tools.qr" },
  cli: { namespace: "tool qr" },
  inputs: { text: "string", format: "string?" },
  outputs: { fileUrl: "string", format: "string" },
  dependencies: { required: ["@appneurox/toolos"], optional: ["@appneurox/aios"] },
  usedBy: ["AIOS", "CommandOS"],
  safety: { riskLevel: "low", requiresApproval: false, rules: ["no_secret_payloads"] }
};

test("valid tool registers and duplicate tool id fails", () => {
  const toolos = new ToolOS();
  assert.equal(toolos.registerTool(manifest).id, "tool.qr.generate");
  assert.throws(() => toolos.registerTool(manifest), /Duplicate tool id/);
});

test("invalid manifest fails", () => {
  const toolos = new ToolOS();
  assert.throws(() => toolos.registerTool({ ...manifest, packageName: "bad", commands: [] }), /Invalid tool manifest/);
});

test("list/get/category and AI-enabled discovery work", () => {
  const toolos = new ToolOS();
  toolos.registerTool(manifest);
  assert.equal(toolos.listTools().length, 1);
  assert.equal(toolos.getTool("tool.qr.generate").packageName, "@appneurox/tool-qr-generator");
  assert.equal(toolos.getToolsByCategory("media").length, 1);
  assert.equal(toolos.getAIEnabledTools()[0].id, "tool.qr.generate");
});

test("unregister removes a tool", () => {
  const toolos = new ToolOS();
  toolos.registerTool(manifest);
  toolos.unregisterTool("tool.qr.generate");
  assert.equal(toolos.listTools().length, 0);
});
