import { ToolManifest, ToolPackageType, ToolRiskLevel } from "../core/domain";
import { badRequest } from "../core/errors";
import { ensureObject, ensureString, normalizeStringArray } from "../core/utils";

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
  manifest?: ToolManifest;
}

export function validateToolManifest(value: unknown): ManifestValidationResult {
  const errors: string[] = [];
  try {
    const raw = ensureObject(value, "manifest");
    const manifest: ToolManifest = {
      id: normalizeId(requiredString(raw.id, "id", errors)),
      name: requiredString(raw.name, "name", errors),
      packageName: requiredPackageName(raw.packageName, errors),
      version: requiredString(raw.version, "version", errors),
      category: requiredString(raw.category, "category", errors),
      type: ensureType(raw.type, errors),
      aiSupport: normalizeAiSupport(raw.aiSupport, errors),
      inputSchema: ensureObject(raw.inputSchema, "inputSchema"),
      outputSchema: ensureObject(raw.outputSchema, "outputSchema"),
      commands: nonEmptyStringArray(raw.commands, "commands", errors),
      permissions: nonEmptyStringArray(raw.permissions, "permissions", errors),
      events: normalizeEvents(raw.events, errors),
      api: normalizeApi(raw.api, errors),
      sdk: normalizeSdk(raw.sdk, errors),
      cli: normalizeCli(raw.cli, errors),
      dependencies: normalizeDependencies(raw.dependencies, errors),
      safety: normalizeSafety(raw.safety, errors),
      usedBy: nonEmptyStringArray(raw.usedBy, "usedBy", errors)
    };
    checkNamespaceAlignment(manifest, errors);
    return { valid: errors.length === 0, errors, manifest: errors.length ? undefined : manifest };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Invalid manifest");
    return { valid: false, errors };
  }
}

export function assertValidToolManifest(value: unknown): ToolManifest {
  const result = validateToolManifest(value);
  if (!result.valid || !result.manifest) badRequest("Tool manifest is invalid", result.errors);
  return result.manifest;
}

function requiredString(value: unknown, field: string, errors: string[]): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${field} is required`);
    return "";
  }
  return value.trim();
}

function requiredPackageName(value: unknown, errors: string[]): string {
  const packageName = requiredString(value, "packageName", errors);
  if (packageName && !packageName.startsWith("@appneurox/")) errors.push("packageName must use @appneurox/ scope");
  return packageName;
}

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
}

function ensureType(value: unknown, errors: string[]): ToolPackageType {
  const type = String(value) as ToolPackageType;
  if (!["core", "api", "sdk", "cli", "worker", "ui"].includes(type)) {
    errors.push("type must be one of core, api, sdk, cli, worker, ui");
    return "core";
  }
  return type;
}

function normalizeAiSupport(value: unknown, errors: string[]): ToolManifest["aiSupport"] {
  const raw = ensureObject(value, "aiSupport");
  if (typeof raw.enabled !== "boolean") errors.push("aiSupport.enabled must be boolean");
  return {
    enabled: raw.enabled === true,
    toolName: typeof raw.toolName === "string" ? raw.toolName : undefined,
    description: typeof raw.description === "string" ? raw.description : undefined
  };
}

function normalizeEvents(value: unknown, errors: string[]): ToolManifest["events"] {
  const raw = ensureObject(value, "events");
  return {
    publishes: nonEmptyStringArray(raw.publishes, "events.publishes", errors),
    subscribes: normalizeStringArray(raw.subscribes, "events.subscribes")
  };
}

function normalizeApi(value: unknown, errors: string[]): ToolManifest["api"] {
  const raw = ensureObject(value, "api");
  const route = requiredString(raw.route, "api.route", errors);
  if (route && !route.startsWith("/v1/tools/")) errors.push("api.route must start with /v1/tools/");
  return { route };
}

function normalizeSdk(value: unknown, errors: string[]): ToolManifest["sdk"] {
  const raw = ensureObject(value, "sdk");
  return { namespace: requiredString(raw.namespace, "sdk.namespace", errors) };
}

function normalizeCli(value: unknown, errors: string[]): ToolManifest["cli"] {
  const raw = ensureObject(value, "cli");
  return { namespace: requiredString(raw.namespace, "cli.namespace", errors) };
}

function normalizeDependencies(value: unknown, errors: string[]): ToolManifest["dependencies"] {
  const raw = ensureObject(value, "dependencies");
  const required = normalizeStringArray(raw.required, "dependencies.required");
  if (!required.includes("@appneurox/toolos")) errors.push("dependencies.required must include @appneurox/toolos");
  return {
    required,
    optional: normalizeStringArray(raw.optional, "dependencies.optional")
  };
}

function normalizeSafety(value: unknown, errors: string[]): ToolManifest["safety"] {
  const raw = ensureObject(value, "safety");
  const riskLevel = String(raw.riskLevel) as ToolRiskLevel;
  if (!["low", "medium", "high", "critical"].includes(riskLevel)) errors.push("safety.riskLevel is invalid");
  if (typeof raw.requiresApproval !== "boolean") errors.push("safety.requiresApproval must be boolean");
  return {
    riskLevel: ["low", "medium", "high", "critical"].includes(riskLevel) ? riskLevel : "low",
    requiresApproval: raw.requiresApproval === true,
    rules: normalizeStringArray(raw.rules, "safety.rules")
  };
}

function nonEmptyStringArray(value: unknown, field: string, errors: string[]): string[] {
  const values = normalizeStringArray(value, field);
  if (values.length === 0) errors.push(`${field} must include at least one value`);
  return values;
}

function checkNamespaceAlignment(manifest: ToolManifest, errors: string[]): void {
  if (!manifest.commands.every((command) => command.startsWith("tool."))) errors.push("commands must use tool.* namespace");
  if (!manifest.permissions.every((permission) => permission.startsWith("tools.") || permission.startsWith("tool."))) errors.push("permissions must use tool.* or tools.* namespace");
  if (!manifest.events.publishes.every((event) => event.startsWith("tool."))) errors.push("published events must use tool.* namespace");
  if (!manifest.sdk.namespace.startsWith("tools.")) errors.push("sdk.namespace must start with tools.");
}
