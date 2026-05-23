const test = require("node:test");
const assert = require("node:assert/strict");

const { ToolOS, qrGeneratorManifest } = require("../dist/index.js");

test("permission denied fails", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrGeneratorManifest);
  assert.throws(() => {
    toolos.executeTool("tool.qr.generate", { text: "x" }, { tenantId: "demo", userId: "user-1", permissions: [] });
  }, /Permission denied/);
});

test("wildcard permission executes", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrGeneratorManifest);
  const result = toolos.executeTool("tool.qr.generate", { text: "x" }, { tenantId: "demo", userId: "user-1", permissions: ["*"] });
  assert.equal(result.status, "succeeded");
});
