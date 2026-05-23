import { ToolManifest, ToolManifestInput, ValidationResult } from "./types";

export class ToolManifestValidator {
  validate(value: unknown): ValidationResult {
    const errors: string[] = [];
    const raw = isObject(value) ? value : {};

    for (const field of ["id", "name", "packageName", "version", "category", "type"]) {
      if (typeof raw[field] !== "string" || String(raw[field]).trim().length === 0) errors.push(`${field} is required`);
    }

    if (typeof raw.packageName === "string" && !raw.packageName.startsWith("@appneurox/")) {
      errors.push("packageName must use @appneurox/ scope");
    }
    if (typeof raw.type === "string" && !["core", "api", "sdk", "cli", "worker", "ui", "deterministic", "ai", "hybrid", "external-api", "generator", "validator", "integration", "manager"].includes(raw.type)) {
      errors.push("type is invalid");
    }

    const ai = isObject(raw.ai) ? raw.ai : raw.aiSupport;
    requireObject(ai, "ai", errors);
    if (isObject(ai) && typeof ai.enabled !== "boolean") errors.push("ai.enabled must be boolean");

    requireObject(raw.events, "events", errors);
    requireObject(raw.api, "api", errors);
    requireObject(raw.sdk, "sdk", errors);
    requireObject(raw.cli, "cli", errors);
    requireObject(raw.dependencies, "dependencies", errors);
    requireObject(raw.safety, "safety", errors);

    const inputs = isObject(raw.inputs) ? raw.inputs : raw.inputSchema;
    const outputs = isObject(raw.outputs) ? raw.outputs : raw.outputSchema;
    requireObject(inputs, "inputs", errors);
    requireObject(outputs, "outputs", errors);

    requireNonEmptyArray(raw.commands, "commands", errors);
    requireNonEmptyArray(raw.permissions, "permissions", errors);
    requireStringArray(raw.usedBy, "usedBy", errors);

    if (isObject(raw.events)) {
      requireStringArray(raw.events.publishes, "events.publishes", errors);
      requireStringArray(raw.events.subscribes, "events.subscribes", errors);
    }
    if (isObject(raw.api) && (typeof raw.api.route !== "string" || !raw.api.route.startsWith("/v1/tools/"))) {
      errors.push("api.route must start with /v1/tools/");
    }
    if (isObject(raw.sdk) && (typeof raw.sdk.namespace !== "string" || (!raw.sdk.namespace.startsWith("tools.") && !raw.sdk.namespace.startsWith("app.tools.")))) {
      errors.push("sdk.namespace must start with tools. or app.tools.");
    }
    if (isObject(raw.cli) && typeof raw.cli.namespace !== "string") errors.push("cli.namespace is required");

    if (isObject(raw.dependencies)) {
      requireStringArray(raw.dependencies.required, "dependencies.required", errors);
      requireStringArray(raw.dependencies.optional, "dependencies.optional", errors);
      if (Array.isArray(raw.dependencies.required) && !raw.dependencies.required.includes("@appneurox/toolos")) {
        errors.push("dependencies.required must include @appneurox/toolos");
      }
    }

    if (isObject(raw.safety)) {
      if (!["low", "medium", "high", "critical"].includes(String(raw.safety.riskLevel))) errors.push("safety.riskLevel is invalid");
      if (typeof raw.safety.requiresApproval !== "boolean") errors.push("safety.requiresApproval must be boolean");
      requireStringArray(raw.safety.rules, "safety.rules", errors);
    }

    if (Array.isArray(raw.commands) && !raw.commands.every((item) => typeof item === "string" && item.startsWith("tool."))) {
      errors.push("commands must use tool.* namespace");
    }
    if (Array.isArray(raw.permissions) && !raw.permissions.every((item) => typeof item === "string" && (item.startsWith("tool.") || item.startsWith("tools.")))) {
      errors.push("permissions must use tool.* or tools.* namespace");
    }

    if (errors.length > 0) return { valid: false, errors };
    return { valid: true, errors, manifest: normalizeManifest(raw as ToolManifestInput) };
  }
}

export function normalizeManifest(manifest: ToolManifestInput): ToolManifest {
  const ai = manifest.ai ?? manifest.aiSupport ?? { enabled: false };
  const inputs = manifest.inputSchema ?? manifest.inputs ?? {};
  const outputs = manifest.outputSchema ?? manifest.outputs ?? {};
  return {
    ...manifest,
    ai,
    aiSupport: ai,
    inputs,
    outputs,
    inputSchema: inputs,
    outputSchema: outputs,
    enabled: manifest.enabled ?? true,
    installed: manifest.installed ?? false,
    events: {
      publishes: manifest.events?.publishes ?? [],
      subscribes: manifest.events?.subscribes ?? []
    },
    dependencies: {
      required: manifest.dependencies?.required ?? [],
      optional: manifest.dependencies?.optional ?? []
    },
    usedBy: manifest.usedBy ?? []
  };
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireObject(value: unknown, field: string, errors: string[]): void {
  if (!isObject(value)) errors.push(`${field} must be an object`);
}

function requireNonEmptyArray(value: unknown, field: string, errors: string[]): void {
  if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === "string" && item.trim().length > 0)) {
    errors.push(`${field} must be a non-empty string array`);
  }
}

function requireStringArray(value: unknown, field: string, errors: string[]): void {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim().length > 0)) {
    errors.push(`${field} must be a string array`);
  }
}
