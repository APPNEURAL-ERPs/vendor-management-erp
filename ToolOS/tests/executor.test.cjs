const test = require("node:test");
const assert = require("node:assert/strict");

const { ToolOS, qrGeneratorManifest } = require("../dist/index.js");

function context(permissions = ["tools.qr.generate"]) {
  return { tenantId: "demo", userId: "user-1", permissions, source: "sdk" };
}

test("ToolOS can register and execute a sample QR generator manifest", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrGeneratorManifest);
  const result = toolos.executeTool("tool.qr.generate", { text: "https://appneurox.com" }, context());
  assert.equal(result.status, "succeeded");
  assert.equal(result.output.format, "png");
  assert.match(result.output.fileUrl, /^tool:\/\/qr\//);
});

test("disabled tool cannot execute", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrGeneratorManifest);
  toolos.disableTool("tool.qr.generate");
  assert.throws(() => toolos.executeTool("tool.qr.generate", { text: "x" }, context()), /disabled/);
});

test("unknown command fails", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrGeneratorManifest);
  assert.throws(() => toolos.executeTool("tool.unknown", { text: "x" }, context()), /Unknown tool command/);
});

test("allowed permission executes and analytics event is tracked", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrGeneratorManifest);
  toolos.executeTool("tool.qr.generate", { text: "x" }, context());
  assert.equal(toolos.analytics.events[0].type, "tool.execution.completed");
  assert.equal(toolos.analytics.metrics[0].toolId, "tool.qr.generate");
});
