const test = require("node:test");
const assert = require("node:assert/strict");

const { ToolOS, ToolManifestValidator, qrGeneratorManifest } = require("../dist/index.js");

test("ToolOS exposes SDK, CLI, API, CommandOS, AIOS, SecurityOS, and AnalyticsOS metadata", () => {
  const toolos = new ToolOS();
  toolos.registerTool(qrGeneratorManifest);
  const metadata = toolos.getDeveloperMetadata()[0];
  assert.equal(metadata.apiRoute, "/v1/tools/tool.qr.generate/execute");
  assert.equal(metadata.sdkNamespace, "tools.qr");
  assert.equal(metadata.cliNamespace, "tool qr");
  assert.equal(metadata.aiEnabled, true);
  assert.deepEqual(toolos.getTool("tool.qr.generate").usedBy, ["CommandOS", "AIOS", "AgenticOS"]);
});

test("ToolManifestValidator accepts legacy aiSupport/inputSchema/outputSchema aliases", () => {
  const validator = new ToolManifestValidator();
  const result = validator.validate({
    ...qrGeneratorManifest,
    ai: undefined,
    inputs: undefined,
    outputs: undefined,
    aiSupport: qrGeneratorManifest.ai,
    inputSchema: qrGeneratorManifest.inputs,
    outputSchema: qrGeneratorManifest.outputs
  });
  assert.equal(result.valid, true);
});
