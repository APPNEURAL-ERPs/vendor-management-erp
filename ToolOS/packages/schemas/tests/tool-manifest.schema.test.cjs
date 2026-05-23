const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const {
  ToolManifestSchema,
  ToolAISchema,
  ToolSafetySchema
} = require("../dist/index.js");

const examplesDir = join(__dirname, "..", "examples");

function readExample(name) {
  return JSON.parse(readFileSync(join(examplesDir, name), "utf8"));
}

function validManifest(overrides = {}) {
  return {
    id: "tool.qr.generate",
    name: "QR Generator",
    packageName: "@appneurox/qr-generator-tool",
    version: "1.0.0",
    description: "Generates QR codes from text, links, and payment URIs.",
    category: "media",
    type: "deterministic",
    ai: {
      enabled: false,
      required: false,
      level: 0
    },
    modes: ["standalone", "platform"],
    commands: [
      {
        name: "tool.qr.generate",
        description: "Generate a QR code.",
        input: "qrRequest",
        output: "qrResult"
      }
    ],
    permissions: [
      {
        name: "tools.qr.generate",
        required: true
      }
    ],
    events: {
      publishes: ["tool.qr.generated"],
      subscribes: []
    },
    api: {
      basePath: "/v1/tools/tool.qr.generate"
    },
    sdk: {
      namespace: "tools.qr"
    },
    cli: {
      namespace: "qr generate"
    },
    inputs: [
      {
        name: "text",
        type: "string",
        required: true
      }
    ],
    outputs: [
      {
        name: "fileUrl",
        type: "string"
      }
    ],
    dependencies: {
      required: ["@appneurox/toolos"],
      optional: [],
      external: []
    },
    usedBy: ["ToolOS", "CommandOS"],
    safety: {
      requiresApproval: false,
      sensitiveData: false,
      allowedForAgents: true,
      rateLimit: {
        enabled: true,
        maxRequests: 100,
        windowSeconds: 60
      }
    },
    ...overrides
  };
}

function errorText(result) {
  return result.success ? "" : result.message;
}

test("all example manifests validate", () => {
  for (const file of [
    "toolos.manifest.json",
    "backup-manager.manifest.json",
    "tenant-manager.manifest.json",
    "os-manifest-validator.manifest.json"
  ]) {
    const result = ToolManifestSchema.safeParse(readExample(file));
    assert.equal(result.success, true, `${file}: ${errorText(result)}`);
  }
});

test("valid deterministic tool manifest passes", () => {
  const result = ToolManifestSchema.safeParse(validManifest());
  assert.equal(result.success, true, errorText(result));
});

test("valid manager tool manifest passes", () => {
  const result = ToolManifestSchema.safeParse(readExample("backup-manager.manifest.json"));
  assert.equal(result.success, true, errorText(result));
});

test("valid AI-enabled tool manifest passes", () => {
  const result = ToolManifestSchema.safeParse(readExample("os-manifest-validator.manifest.json"));
  assert.equal(result.success, true, errorText(result));
});

test("invalid package name fails with useful error", () => {
  const result = ToolManifestSchema.safeParse(validManifest({ packageName: "qr-generator-tool" }));
  assert.equal(result.success, false);
  assert.match(errorText(result), /\$\.packageName/);
});

test("missing permission fails with useful error", () => {
  const result = ToolManifestSchema.safeParse(validManifest({ permissions: [] }));
  assert.equal(result.success, false);
  assert.match(errorText(result), /\$\.permissions/);
});

test("missing command fails with useful error", () => {
  const result = ToolManifestSchema.safeParse(validManifest({ commands: [] }));
  assert.equal(result.success, false);
  assert.match(errorText(result), /\$\.commands/);
});

test("invalid AI config fails", () => {
  const result = ToolAISchema.safeParse({ enabled: false, required: true, level: 1 });
  assert.equal(result.success, false);
  assert.match(errorText(result), /\$\.level/);
});

test("invalid safety config fails", () => {
  const result = ToolSafetySchema.safeParse({
    requiresApproval: false,
    sensitiveData: false,
    allowedForAgents: true,
    rateLimit: {
      enabled: true,
      maxRequests: 0,
      windowSeconds: 60
    }
  });
  assert.equal(result.success, false);
  assert.match(errorText(result), /\$\.rateLimit\.maxRequests/);
});

test("parse throws useful bad manifest errors", () => {
  assert.throws(() => {
    ToolManifestSchema.parse(validManifest({ packageName: "bad", commands: [], permissions: [] }));
  }, /\$\.packageName.*\$\.commands.*\$\.permissions/);
});
