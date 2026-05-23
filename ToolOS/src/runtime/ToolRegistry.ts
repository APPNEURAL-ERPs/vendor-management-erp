import { ToolManifest, ValidationResult } from "./types";

export class ToolRegistry {
  private readonly tools = new Map<string, ToolManifest>();

  validateManifest(manifest: unknown): ValidationResult {
    const errors: string[] = [];
    const raw = isObject(manifest) ? manifest : {};

    const requiredStrings = ["id", "name", "packageName", "version", "category", "type"] as const;
    for (const field of requiredStrings) {
      if (typeof raw[field] !== "string" || String(raw[field]).trim().length === 0) errors.push(`${field} is required`);
    }

    if (typeof raw.packageName === "string" && !raw.packageName.startsWith("@appneurox/")) errors.push("packageName must use @appneurox/ scope");
    if (typeof raw.type === "string" && !["core", "api", "sdk", "cli", "worker", "ui"].includes(raw.type)) errors.push("type is invalid");

    requireObject(raw.aiSupport, "aiSupport", errors);
    if (isObject(raw.aiSupport) && typeof raw.aiSupport.enabled !== "boolean") errors.push("aiSupport.enabled must be boolean");
    requireObject(raw.inputSchema, "inputSchema", errors);
    requireObject(raw.outputSchema, "outputSchema", errors);
    requireObject(raw.events, "events", errors);
    requireObject(raw.api, "api", errors);
    requireObject(raw.sdk, "sdk", errors);
    requireObject(raw.cli, "cli", errors);
    requireObject(raw.dependencies, "dependencies", errors);
    requireObject(raw.safety, "safety", errors);

    requireNonEmptyArray(raw.commands, "commands", errors);
    requireNonEmptyArray(raw.permissions, "permissions", errors);
    requireNonEmptyArray(raw.usedBy, "usedBy", errors);

    if (isObject(raw.events)) requireNonEmptyArray(raw.events.publishes, "events.publishes", errors);
    if (isObject(raw.api) && (typeof raw.api.route !== "string" || !raw.api.route.startsWith("/v1/tools/"))) errors.push("api.route must start with /v1/tools/");
    if (isObject(raw.sdk) && (typeof raw.sdk.namespace !== "string" || !raw.sdk.namespace.startsWith("tools."))) errors.push("sdk.namespace must start with tools.");
    if (isObject(raw.cli) && typeof raw.cli.namespace !== "string") errors.push("cli.namespace is required");
    if (isObject(raw.dependencies)) {
      requireNonEmptyArray(raw.dependencies.required, "dependencies.required", errors);
      if (Array.isArray(raw.dependencies.required) && !raw.dependencies.required.includes("@appneurox/toolos")) {
        errors.push("dependencies.required must include @appneurox/toolos");
      }
    }
    if (isObject(raw.safety)) {
      if (!["low", "medium", "high", "critical"].includes(String(raw.safety.riskLevel))) errors.push("safety.riskLevel is invalid");
      if (typeof raw.safety.requiresApproval !== "boolean") errors.push("safety.requiresApproval must be boolean");
      if (!Array.isArray(raw.safety.rules)) errors.push("safety.rules must be an array");
    }

    if (Array.isArray(raw.commands) && !raw.commands.every((item) => typeof item === "string" && item.startsWith("tool."))) {
      errors.push("commands must use tool.* namespace");
    }
    if (Array.isArray(raw.permissions) && !raw.permissions.every((item) => typeof item === "string" && (item.startsWith("tool.") || item.startsWith("tools.")))) {
      errors.push("permissions must use tool.* or tools.* namespace");
    }

    return { valid: errors.length === 0, errors };
  }

  register(manifest: ToolManifest): ToolManifest {
    const validation = this.validateManifest(manifest);
    if (!validation.valid) throw new Error(`Invalid tool manifest: ${validation.errors.join("; ")}`);
    if (this.tools.has(manifest.id)) throw new Error(`Tool already registered: ${manifest.id}`);
    this.tools.set(manifest.id, structuredClone(manifest));
    return this.get(manifest.id);
  }

  unregister(toolId: string): void {
    if (!this.tools.delete(toolId)) throw new Error(`Unknown tool: ${toolId}`);
  }

  list(): ToolManifest[] {
    return Array.from(this.tools.values()).map((tool) => structuredClone(tool));
  }

  get(toolId: string): ToolManifest {
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`Unknown tool: ${toolId}`);
    return structuredClone(tool);
  }

  byCategory(category: string): ToolManifest[] {
    return this.list().filter((tool) => tool.category === category);
  }

  aiEnabled(): ToolManifest[] {
    return this.list().filter((tool) => tool.aiSupport.enabled);
  }

  findByCommand(commandName: string): ToolManifest {
    const tool = this.list().find((item) => item.commands.includes(commandName));
    if (!tool) throw new Error(`Unknown tool command: ${commandName}`);
    return tool;
  }
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
