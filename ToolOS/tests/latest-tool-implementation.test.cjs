const test = require("node:test");
const assert = require("node:assert/strict");
const { existsSync, mkdtempSync, readFileSync, rmSync } = require("node:fs");
const { basename, join } = require("node:path");
const { tmpdir } = require("node:os");
const { spawnSync } = require("node:child_process");

const { ToolOS, ToolPackageGenerator } = require("../dist/index.js");

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
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

test("latest generated APPNEUROX tool implementation is ready", () => {
  const outputRoot = mkdtempSync(join(tmpdir(), "appneurox-latest-tool-"));
  const schemasRoot = join(__dirname, "..", "packages", "schemas");
  try {
    run(process.execPath, [require.resolve("typescript/bin/tsc"), "-p", "tsconfig.json"], schemasRoot);
    const { ToolManifestSchema } = require("../packages/schemas/dist/index.js");

    const generated = new ToolPackageGenerator().generate(qrInput(outputRoot));
    const root = generated.rootDir;
    const manifestPath = join(root, "manifest.json");
    const packageJsonPath = join(root, "package.json");
    const manifest = readJson(manifestPath);
    const packageJson = readJson(packageJsonPath);

    assert.equal(existsSync(root), true, "package exists");
    assert.equal(packageJson.name, "@appneurox/tool-qr-generator", "package.json is valid");
    assert.equal(existsSync(manifestPath), true, "manifest.json exists");
    const schemaResult = ToolManifestSchema.safeParse(manifest);
    assert.equal(schemaResult.success, true, schemaResult.success ? "" : schemaResult.message);
    assert.equal(manifest.id, basename(root), "tool id matches folder name");
    assert.equal(manifest.packageName, `@appneurox/tool-${manifest.id}`, "package name follows @appneurox/tool-{tool-id}");
    assert.equal(existsSync(join(root, "src", "schemas", "index.ts")), true, "input/output schema exists");
    assert.equal(readFileSync(join(root, "src", "schemas", "input.schema.ts"), "utf8").includes("inputSchema"), true, "input schema exists");
    assert.equal(readFileSync(join(root, "src", "schemas", "output.schema.ts"), "utf8").includes("outputSchema"), true, "output schema exists");
    assert.equal(existsSync(join(root, "src", "core", "index.ts")), true, "core implementation exists");
    assert.equal(existsSync(join(root, "src", "api", "index.ts")), true, "API route exists");
    assert.equal(existsSync(join(root, "src", "sdk", "index.ts")), true, "SDK client exists");
    assert.equal(existsSync(join(root, "src", "cli", "index.ts")), true, "CLI command exists");
    assert.equal(existsSync(join(root, "src", "commands", "index.ts")), true, "CommandOS command is defined");
    assert.equal(existsSync(join(root, "src", "permissions", "index.ts")), true, "SecurityOS permission is defined");

    const toolos = new ToolOS({
      handlers: {
        [manifest.id]: () => ({ fileUrl: "tool://qr/sample.png", format: "png" })
      }
    });
    toolos.registerTool(manifest);
    assert.throws(() => toolos.executeTool("tool.qr.generate", { text: "x" }, { tenantId: "t1", userId: "u1", permissions: [] }), /Permission denied/);
    const execution = toolos.executeTool("tool.qr.generate", { text: "x" }, { tenantId: "t1", userId: "u1", permissions: ["tools.qr.generate"] });
    assert.equal(execution.status, "succeeded", "ToolOS execution works");
    assert.equal(toolos.analytics.metrics.length, 1, "analytics event is tracked");
    assert.equal(toolos.analytics.events.length, 1, "event is emitted");

    const permissionTest = readFileSync(join(root, "tests", "permission.test.cjs"), "utf8");
    assert.match(permissionTest, /assert\.throws/, "permission denied test exists");
    assert.match(permissionTest, /assert\.doesNotThrow/, "permission allowed test exists");
    assert.equal(existsSync(join(root, "README.md")), true, "docs exist");
    assert.equal(existsSync(join(root, "docs", "usage.md")), true, "docs exist");
    assert.equal(existsSync(join(root, "tests", "e2e.test.cjs")), true, "tests exist");

    run("npm", ["install", "--silent"], root);
    run("npm", ["run", "build", "--silent"], root);
    run("npm", ["test", "--silent"], root);
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
});
