const test = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, rmSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { spawnSync } = require("node:child_process");

const { ToolPackageGenerator } = require("../dist/index.js");

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function qrInput(outputRoot) {
  return {
    toolId: "qr-generator",
    name: "QR Generator",
    category: "media",
    type: "deterministic",
    aiLevel: "none",
    commandName: "tool.qr.generate",
    permissionName: "tools.qr.generate",
    inputSchema: { text: "string", format: "string?" },
    outputSchema: { fileUrl: "string", format: "string" },
    sdkNamespace: "qr",
    cliNamespace: "qr-generator",
    outputRoot
  };
}

function readinessReport(generated) {
  const manifest = generated.manifest;
  const has = (file) => generated.files.includes(file);
  return {
    identity: {
      id: manifest.id,
      package: manifest.packageName,
      category: manifest.category,
      type: manifest.type,
      aiLevel: manifest.aiSupport.level
    },
    interfaces: {
      coreUsable: has("src/core/index.ts"),
      apiUsable: has("src/api/routes.ts"),
      sdkUsable: has("src/sdk/client.ts"),
      cliUsable: has("src/cli/command.ts"),
      commandOSUsable: has("src/commands/command.definition.ts"),
      toolOSUsable: has("src/adapters/adapters.ts"),
      aiosUsable: manifest.aiSupport.enabled ? has("src/ai/optional-ai-layer.ts") : null
    },
    security: {
      permissionDefined: Array.isArray(manifest.permissions) && manifest.permissions.length > 0,
      permissionChecked: has("src/permissions/index.ts") && has("tests/permission.test.cjs"),
      deniedCaseTested: has("tests/permission.test.cjs") || has("tests/api.test.cjs"),
      auditEventEmitted: Array.isArray(manifest.events.publishes) && manifest.events.publishes.length > 0 && has("src/events/events.ts")
    },
    testing: {
      unitTests: has("tests/unit.test.cjs"),
      schemaTests: has("tests/schema.test.cjs"),
      manifestTests: has("tests/manifest.test.cjs"),
      apiTests: has("tests/api.test.cjs"),
      sdkTests: has("tests/sdk.test.cjs"),
      cliTests: has("tests/cli.test.cjs"),
      securityTests: has("tests/permission.test.cjs"),
      e2eTests: has("tests/e2e.test.cjs")
    },
    documentation: {
      readme: has("README.md"),
      apiDocs: has("docs/api.md"),
      sdkDocs: has("docs/sdk.md"),
      cliDocs: has("docs/cli.md"),
      examples: has("docs/usage.md")
    }
  };
}

function assertReady(generated) {
  const report = readinessReport(generated);
  for (const [section, checks] of Object.entries(report)) {
    if (section === "identity") continue;
    for (const [name, value] of Object.entries(checks)) {
      if (name === "aiosUsable" && value === null) continue;
      assert.equal(value, true, `${report.identity.id} readiness failed: ${section}.${name}`);
    }
  }
  return report;
}

test("generator creates valid QR tool package that builds and tests", () => {
  const outputRoot = mkdtempSync(join(tmpdir(), "appneurox-tools-"));
  try {
    const generated = new ToolPackageGenerator().generate(qrInput(outputRoot));
    assert.ok(generated.files.includes("manifest.json"));
    assert.ok(generated.files.includes("src/core/index.ts"));
    assert.ok(generated.files.includes("src/api/routes.ts"));
    assert.ok(generated.files.includes("src/sdk/client.ts"));
    assert.ok(generated.files.includes("src/cli/command.ts"));
    assert.ok(generated.files.includes("tests/unit.test.cjs"));
    assert.ok(generated.files.includes("tests/snapshot.test.cjs"));
    assert.ok(generated.files.includes("tests/error.test.cjs"));
    assert.ok(generated.files.includes("tests/no-ai.test.cjs"));
    assert.ok(generated.files.includes("tests/schema.test.cjs"));
    assert.ok(generated.files.includes("tests/manifest.test.cjs"));
    assert.ok(generated.files.includes("tests/api.test.cjs"));
    assert.ok(generated.files.includes("tests/sdk.test.cjs"));
    assert.ok(generated.files.includes("tests/cli.test.cjs"));
    assert.ok(generated.files.includes("tests/permission.test.cjs"));
    assert.ok(generated.files.includes("tests/e2e.test.cjs"));
    assert.ok(generated.files.includes("docs/api.md"));
    assert.ok(generated.files.includes("docs/sdk.md"));
    assert.ok(generated.files.includes("docs/cli.md"));
    assert.equal(generated.files.includes("src/ai/optional-ai-layer.ts"), false);
    assertReady(generated);

    run("npm", ["install", "--silent"], generated.rootDir);
    run("npm", ["test", "--silent"], generated.rootDir);
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("CLI supports appneurox tool create brand-checker --type hybrid --ai optional", () => {
  const outputRoot = mkdtempSync(join(tmpdir(), "appneurox-tools-cli-"));
  try {
    const cli = join(__dirname, "..", "dist", "generator", "cli.js");
    run("node", [cli, "tool", "create", "brand-checker", "--type", "hybrid", "--ai", "optional", "--output", outputRoot], join(__dirname, ".."));
    const generatedRoot = join(outputRoot, "brand-checker");
    const manifest = require(join(generatedRoot, "manifest.json"));
    assert.equal(manifest.aiSupport.enabled, true);
    assert.equal(manifest.aiSupport.required, false);
    assert.equal(manifest.aiSupport.mode, "hybrid");
    const generated = new ToolPackageGenerator().generate({
      toolId: "brand-checker",
      name: "Brand Checker",
      category: "utility",
      type: "hybrid",
      aiLevel: "optional",
      commandName: "tool.brand-checker.run",
      permissionName: "tools.brand-checker.run",
      inputSchema: { text: "string", channel: "string?" },
      outputSchema: { compliant: "boolean", score: "number" },
      sdkNamespace: "brand.checker",
      cliNamespace: "brand-checker",
      outputRoot
    });
    assertReady(generated);
    run("npm", ["install", "--silent"], generatedRoot);
    run("npm", ["test", "--silent"], generatedRoot);
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("generator creates external API connector package with mock provider tests", () => {
  const outputRoot = mkdtempSync(join(tmpdir(), "appneurox-tools-external-"));
  try {
    const generated = new ToolPackageGenerator().generate({
      toolId: "domain-checker",
      name: "Domain Checker",
      category: "developer",
      type: "connector",
      aiLevel: "none",
      commandName: "tool.domain.check",
      permissionName: "tools.domain.check",
      inputSchema: { domain: "string" },
      outputSchema: { available: "boolean", provider: "string" },
      sdkNamespace: "domain",
      cliNamespace: "domain-checker",
      outputRoot
    });
    assert.ok(generated.files.includes("src/providers/providers.ts"));
    assert.ok(generated.files.includes("tests/provider.test.cjs"));
    assert.equal(generated.manifest.provider.configurable, true);
    assert.equal(generated.manifest.provider.hardcodedProvider, false);
    assertReady(generated);

    run("npm", ["install", "--silent"], generated.rootDir);
    run("npm", ["test", "--silent"], generated.rootDir);
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("generator creates generator tool package with dry-run and overwrite tests", () => {
  const outputRoot = mkdtempSync(join(tmpdir(), "appneurox-tools-generator-"));
  try {
    const generated = new ToolPackageGenerator().generate({
      toolId: "micro-app-generator",
      name: "Micro App Generator",
      category: "developer",
      type: "generator",
      aiLevel: "none",
      commandName: "tool.micro_app.generate",
      permissionName: "tools.micro_app.generate",
      inputSchema: { outputDir: "string", blueprint: "object?", dryRun: "boolean?", force: "boolean?" },
      outputSchema: { dryRun: "boolean", generatedFiles: "array", skippedFiles: "array", outputDir: "string" },
      sdkNamespace: "microApp",
      cliNamespace: "micro-app-generator",
      outputRoot
    });
    assert.ok(generated.files.includes("src/templates/templates.ts"));
    assert.ok(generated.files.includes("tests/generator.test.cjs"));
    assertReady(generated);

    run("npm", ["install", "--silent"], generated.rootDir);
    run("npm", ["test", "--silent"], generated.rootDir);
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("generator creates validator tool package with strict and soft mode tests", () => {
  const outputRoot = mkdtempSync(join(tmpdir(), "appneurox-tools-validator-"));
  try {
    const generated = new ToolPackageGenerator().generate({
      toolId: "brand-rule-validator",
      name: "Brand Rule Validator",
      category: "brand",
      type: "validator",
      aiLevel: "none",
      commandName: "tool.brand_rule.validate",
      permissionName: "tools.brand_rule.validate",
      inputSchema: { payload: "object", rules: "array?", mode: "string?" },
      outputSchema: { valid: "boolean", score: "number?", issues: "array", warnings: "array", suggestions: "array?" },
      sdkNamespace: "brandRule",
      cliNamespace: "brand-rule-validator",
      outputRoot
    });
    assert.ok(generated.files.includes("src/rules/rules.ts"));
    assert.ok(generated.files.includes("tests/validator.test.cjs"));
    assertReady(generated);

    run("npm", ["install", "--silent"], generated.rootDir);
    run("npm", ["test", "--silent"], generated.rootDir);
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
});
