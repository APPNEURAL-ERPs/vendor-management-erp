const test = require("node:test");
const assert = require("node:assert/strict");

const { ToolOS } = require("../dist/index.js");

test("installTool(packageName), enableTool, and executeTool work end to end", () => {
  const toolos = new ToolOS();
  const installed = toolos.installTool("@appneurox/tool-qr-generator");
  assert.equal(installed.installed, true);
  assert.equal(installed.enabled, true);

  toolos.disableTool("tool.qr.generate");
  assert.equal(toolos.getTool("tool.qr.generate").enabled, false);
  toolos.enableTool("tool.qr.generate");

  const result = toolos.executeTool("tool.qr.generate", { text: "upi://pay?pa=demo@appneurox" }, {
    tenantId: "demo",
    userId: "user-1",
    permissions: ["tools.qr.generate"],
    source: "cli"
  });
  assert.equal(result.status, "succeeded");
  assert.equal(toolos.getAIEnabledTools().length, 1);
  assert.equal(toolos.getDeveloperMetadata()[0].marketplace.publisher, "APPNEUROX");
});
