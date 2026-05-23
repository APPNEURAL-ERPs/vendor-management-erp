import { ToolRegistry } from "./ToolRegistry";
import { ToolManifest, ToolManifestInput } from "./types";

export class ToolInstaller {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly marketplace: Record<string, ToolManifestInput> = defaultMarketplace
  ) {}

  installTool(packageName: string | ToolManifestInput): ToolManifest {
    const manifest = typeof packageName === "string" ? this.marketplace[packageName] : packageName;
    if (!manifest) throw new Error(`Unknown tool package: ${packageName}`);
    return this.registry.registerTool({ ...manifest, installed: true, enabled: manifest.enabled ?? true });
  }
}

export const qrGeneratorManifest: ToolManifestInput = {
  id: "tool.qr.generate",
  name: "QR Generator",
  packageName: "@appneurox/tool-qr-generator",
  version: "1.0.0",
  category: "media",
  type: "core",
  ai: {
    enabled: true,
    toolName: "qr_generator",
    description: "Generates QR codes for URLs, payment links, and short text."
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
  inputs: {
    text: "string",
    format: "string?"
  },
  outputs: {
    fileUrl: "string",
    format: "string"
  },
  dependencies: {
    required: ["@appneurox/toolos"],
    optional: ["@appneurox/agenticos", "@appneurox/aios"]
  },
  usedBy: ["CommandOS", "AIOS", "AgenticOS"],
  safety: {
    riskLevel: "low",
    requiresApproval: false,
    rules: ["no_secret_payloads"]
  },
  marketplace: {
    summary: "Generate QR code assets from text, links, and payment URIs.",
    publisher: "APPNEUROX",
    license: "MIT",
    tags: ["qr", "generator", "media", "ai-enabled"]
  }
};

const defaultMarketplace: Record<string, ToolManifestInput> = {
  [qrGeneratorManifest.packageName]: qrGeneratorManifest
};
