export const ToolTypes = [
  "deterministic",
  "ai",
  "hybrid",
  "external-api",
  "generator",
  "validator",
  "integration",
  "manager"
] as const;

export const ToolAILevels = [0, 1, 2] as const;
export const ToolModes = ["standalone", "platform", "agent-tool"] as const;

export type ToolType = (typeof ToolTypes)[number];
export type ToolAILevel = (typeof ToolAILevels)[number];
export type ToolMode = (typeof ToolModes)[number];

export interface ToolInput {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "json";
  required?: boolean;
  description?: string;
  default?: unknown;
}

export interface ToolOutput {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "json";
  description?: string;
}

export interface ToolCommand {
  name: string;
  description?: string;
  input?: string;
  output?: string;
}

export interface ToolPermission {
  name: string;
  description?: string;
  required?: boolean;
}

export interface ToolAI {
  enabled: boolean;
  required: boolean;
  level: ToolAILevel;
  provider?: string;
}

export interface ToolAPI {
  basePath: string;
}

export interface ToolSDK {
  namespace: string;
}

export interface ToolCLI {
  namespace: string;
}

export interface ToolSafety {
  requiresApproval: boolean;
  sensitiveData: boolean;
  allowedForAgents: boolean;
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowSeconds: number;
  };
}

export interface ToolDependency {
  required: string[];
  optional: string[];
  external: string[];
}

export interface ToolManifest {
  id: string;
  name: string;
  packageName: string;
  version: string;
  description: string;
  category: string;
  type: ToolType;
  ai: ToolAI;
  modes: ToolMode[];
  commands: Array<ToolCommand | string>;
  permissions: Array<ToolPermission | string>;
  events: {
    publishes: string[];
    subscribes: string[];
  };
  api: ToolAPI;
  sdk: ToolSDK;
  cli: ToolCLI;
  inputs: ToolInput[];
  outputs: ToolOutput[];
  dependencies: ToolDependency;
  usedBy: string[];
  safety: ToolSafety;
}

export interface SchemaIssue {
  path: string;
  message: string;
}

export interface SchemaParseSuccess<T> {
  success: true;
  data: T;
}

export interface SchemaParseFailure {
  success: false;
  errors: SchemaIssue[];
  message: string;
}

export type SchemaParseResult<T> = SchemaParseSuccess<T> | SchemaParseFailure;

export interface Schema<T> {
  parse(value: unknown): T;
  safeParse(value: unknown): SchemaParseResult<T>;
}

class AppneuroxSchema<T> implements Schema<T> {
  constructor(private readonly validator: (value: unknown) => SchemaParseResult<T>) {}

  parse(value: unknown): T {
    const result = this.safeParse(value);
    if (!result.success) throw new Error(result.message);
    return result.data;
  }

  safeParse(value: unknown): SchemaParseResult<T> {
    return this.validator(value);
  }
}

export const ToolInputSchema: Schema<ToolInput> = createSchema(validateToolInput);
export const ToolOutputSchema: Schema<ToolOutput> = createSchema(validateToolOutput);
export const ToolCommandSchema: Schema<ToolCommand> = createSchema(validateToolCommand);
export const ToolPermissionSchema: Schema<ToolPermission> = createSchema(validateToolPermission);
export const ToolAISchema: Schema<ToolAI> = createSchema(validateToolAI);
export const ToolAPISchema: Schema<ToolAPI> = createSchema(validateToolAPI);
export const ToolSDKSchema: Schema<ToolSDK> = createSchema(validateToolSDK);
export const ToolCLISchema: Schema<ToolCLI> = createSchema(validateToolCLI);
export const ToolSafetySchema: Schema<ToolSafety> = createSchema(validateToolSafety);
export const ToolDependencySchema: Schema<ToolDependency> = createSchema(validateToolDependency);
export const ToolManifestSchema: Schema<ToolManifest> = createSchema(validateToolManifest);

function createSchema<T>(validator: (value: unknown, path?: string) => SchemaIssue[]): Schema<T> {
  return new AppneuroxSchema<T>((value) => {
    const errors = validator(value);
    if (errors.length > 0) return failure(errors);
    return { success: true, data: value as T };
  });
}

function validateToolManifest(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;

  requireString(raw.id, `${path}.id`, errors, isToolId);
  requireString(raw.name, `${path}.name`, errors);
  requireString(raw.packageName, `${path}.packageName`, errors, isPackageName);
  requireString(raw.version, `${path}.version`, errors);
  requireString(raw.description, `${path}.description`, errors);
  requireString(raw.category, `${path}.category`, errors);
  requireEnum(raw.type, ToolTypes, `${path}.type`, errors);
  errors.push(...validateToolAI(raw.ai, `${path}.ai`));
  requireEnumArray(raw.modes, ToolModes, `${path}.modes`, errors, { min: 1 });
  errors.push(...validateArray(raw.commands, `${path}.commands`, validateToolCommandLike, { min: 1 }));
  errors.push(...validateArray(raw.permissions, `${path}.permissions`, validateToolPermissionLike, { min: 1 }));
  errors.push(...validateEvents(raw.events, `${path}.events`));
  errors.push(...validateToolAPI(raw.api, `${path}.api`));
  errors.push(...validateToolSDK(raw.sdk, `${path}.sdk`));
  errors.push(...validateToolCLI(raw.cli, `${path}.cli`));
  errors.push(...validateArray(raw.inputs, `${path}.inputs`, validateToolInput));
  errors.push(...validateArray(raw.outputs, `${path}.outputs`, validateToolOutput, { min: 1 }));
  errors.push(...validateToolDependency(raw.dependencies, `${path}.dependencies`));
  requireStringArray(raw.usedBy, `${path}.usedBy`, errors);
  errors.push(...validateToolSafety(raw.safety, `${path}.safety`));
  errors.push(...validateAIConsistency(raw));
  return errors;
}

function validateToolInput(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireString(raw.name, `${path}.name`, errors, isIdentifierLike);
  requireEnum(raw.type, ["string", "number", "boolean", "object", "array", "json"] as const, `${path}.type`, errors);
  requireOptionalBoolean(raw.required, `${path}.required`, errors);
  requireOptionalString(raw.description, `${path}.description`, errors);
  return errors;
}

function validateToolOutput(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireString(raw.name, `${path}.name`, errors, isIdentifierLike);
  requireEnum(raw.type, ["string", "number", "boolean", "object", "array", "json"] as const, `${path}.type`, errors);
  requireOptionalString(raw.description, `${path}.description`, errors);
  return errors;
}

function validateToolCommand(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireString(raw.name, `${path}.name`, errors, (item) => item.startsWith("tool."));
  requireOptionalString(raw.description, `${path}.description`, errors);
  requireOptionalString(raw.input, `${path}.input`, errors);
  requireOptionalString(raw.output, `${path}.output`, errors);
  return errors;
}

function validateToolCommandLike(value: unknown, path = "$"): SchemaIssue[] {
  if (typeof value === "string") {
    return value.startsWith("tool.") ? [] : [issue(path, "has invalid format")];
  }
  return validateToolCommand(value, path);
}

function validateToolPermission(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireString(raw.name, `${path}.name`, errors, (item) => item.startsWith("tools.") || item.startsWith("tool."));
  requireOptionalString(raw.description, `${path}.description`, errors);
  requireOptionalBoolean(raw.required, `${path}.required`, errors);
  return errors;
}

function validateToolPermissionLike(value: unknown, path = "$"): SchemaIssue[] {
  if (typeof value === "string") {
    return value.startsWith("tools.") || value.startsWith("tool.") ? [] : [issue(path, "has invalid format")];
  }
  return validateToolPermission(value, path);
}

function validateToolAI(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireBoolean(raw.enabled, `${path}.enabled`, errors);
  requireBoolean(raw.required, `${path}.required`, errors);
  requireEnum(raw.level, ToolAILevels, `${path}.level`, errors);
  requireOptionalString(raw.provider, `${path}.provider`, errors);
  if (typeof raw.enabled === "boolean" && typeof raw.required === "boolean" && typeof raw.level === "number") {
    if (!raw.enabled && raw.level !== 0) errors.push(issue(`${path}.level`, "level must be 0 when ai.enabled is false"));
    if (raw.required && raw.level !== 2) errors.push(issue(`${path}.level`, "level must be 2 when ai.required is true"));
    if (raw.level === 2 && !raw.required) errors.push(issue(`${path}.required`, "ai.required must be true when level is 2"));
    if (raw.enabled && raw.level === 0) errors.push(issue(`${path}.level`, "level must be 1 or 2 when ai.enabled is true"));
  }
  return errors;
}

function validateToolAPI(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireString(raw.basePath, `${path}.basePath`, errors, (item) => item.startsWith("/v1/tools/"));
  return errors;
}

function validateToolSDK(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireString(raw.namespace, `${path}.namespace`, errors, (item) => item.startsWith("tools.") || item.startsWith("app.tools."));
  return errors;
}

function validateToolCLI(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireString(raw.namespace, `${path}.namespace`, errors);
  return errors;
}

function validateToolSafety(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireBoolean(raw.requiresApproval, `${path}.requiresApproval`, errors);
  requireBoolean(raw.sensitiveData, `${path}.sensitiveData`, errors);
  requireBoolean(raw.allowedForAgents, `${path}.allowedForAgents`, errors);
  const rateLimit = requireObject(raw.rateLimit, `${path}.rateLimit`, errors);
  if (rateLimit) {
    requireBoolean(rateLimit.enabled, `${path}.rateLimit.enabled`, errors);
    requirePositiveInteger(rateLimit.maxRequests, `${path}.rateLimit.maxRequests`, errors);
    requirePositiveInteger(rateLimit.windowSeconds, `${path}.rateLimit.windowSeconds`, errors);
  }
  return errors;
}

function validateToolDependency(value: unknown, path = "$"): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireStringArray(raw.required, `${path}.required`, errors);
  requireStringArray(raw.optional, `${path}.optional`, errors);
  requireStringArray(raw.external, `${path}.external`, errors);
  if (Array.isArray(raw.required) && !raw.required.includes("@appneurox/toolos")) {
    errors.push(issue(`${path}.required`, "dependencies.required must include @appneurox/toolos"));
  }
  return errors;
}

function validateEvents(value: unknown, path: string): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const raw = requireObject(value, path, errors);
  if (!raw) return errors;
  requireStringArray(raw.publishes, `${path}.publishes`, errors, (item) => item.startsWith("tool."));
  requireStringArray(raw.subscribes, `${path}.subscribes`, errors, (item) => item.startsWith("tool.") || item.includes("."));
  return errors;
}

function validateAIConsistency(manifest: Record<string, unknown>): SchemaIssue[] {
  const errors: SchemaIssue[] = [];
  const ai = manifest.ai as Record<string, unknown> | undefined;
  if (!ai || typeof ai !== "object") return errors;
  if ((manifest.type === "ai" || manifest.type === "hybrid") && ai.enabled !== true) {
    errors.push(issue("$.ai.enabled", "AI and hybrid tools must enable AI"));
  }
  if (manifest.type === "ai" && ai.level !== 2) {
    errors.push(issue("$.ai.level", "AI tools must use AI level 2"));
  }
  return errors;
}

function validateArray<T>(
  value: unknown,
  path: string,
  validator: (item: unknown, path?: string) => SchemaIssue[],
  options: { min?: number } = {}
): SchemaIssue[] {
  if (!Array.isArray(value)) return [issue(path, "must be an array")];
  const errors: SchemaIssue[] = [];
  if (options.min !== undefined && value.length < options.min) errors.push(issue(path, `must include at least ${options.min} item(s)`));
  value.forEach((item, index) => errors.push(...validator(item, `${path}[${index}]`)));
  return errors;
}

function requireObject(value: unknown, path: string, errors: SchemaIssue[]): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push(issue(path, "must be an object"));
    return undefined;
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, path: string, errors: SchemaIssue[], predicate?: (value: string) => boolean): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(issue(path, "must be a non-empty string"));
    return;
  }
  if (predicate && !predicate(value)) errors.push(issue(path, "has invalid format"));
}

function requireOptionalString(value: unknown, path: string, errors: SchemaIssue[]): void {
  if (value !== undefined && typeof value !== "string") errors.push(issue(path, "must be a string"));
}

function requireBoolean(value: unknown, path: string, errors: SchemaIssue[]): void {
  if (typeof value !== "boolean") errors.push(issue(path, "must be a boolean"));
}

function requireOptionalBoolean(value: unknown, path: string, errors: SchemaIssue[]): void {
  if (value !== undefined && typeof value !== "boolean") errors.push(issue(path, "must be a boolean"));
}

function requirePositiveInteger(value: unknown, path: string, errors: SchemaIssue[]): void {
  if (!Number.isInteger(value) || Number(value) <= 0) errors.push(issue(path, "must be a positive integer"));
}

function requireStringArray(value: unknown, path: string, errors: SchemaIssue[], predicate?: (value: string) => boolean): void {
  if (!Array.isArray(value)) {
    errors.push(issue(path, "must be an array"));
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) errors.push(issue(`${path}[${index}]`, "must be a non-empty string"));
    else if (predicate && !predicate(item)) errors.push(issue(`${path}[${index}]`, "has invalid format"));
  });
}

function requireEnum<T extends readonly (string | number)[]>(value: unknown, values: T, path: string, errors: SchemaIssue[]): void {
  if (!values.includes(value as T[number])) errors.push(issue(path, `must be one of ${values.join(", ")}`));
}

function requireEnumArray<T extends readonly string[]>(
  value: unknown,
  values: T,
  path: string,
  errors: SchemaIssue[],
  options: { min?: number } = {}
): void {
  if (!Array.isArray(value)) {
    errors.push(issue(path, "must be an array"));
    return;
  }
  if (options.min !== undefined && value.length < options.min) errors.push(issue(path, `must include at least ${options.min} item(s)`));
  value.forEach((item, index) => {
    if (!values.includes(item)) errors.push(issue(`${path}[${index}]`, `must be one of ${values.join(", ")}`));
  });
}

function isPackageName(value: string): boolean {
  return /^@appneurox\/[a-z0-9][a-z0-9._-]*$/.test(value);
}

function isToolId(value: string): boolean {
  return /^(tool\.)?[a-z0-9][a-z0-9._-]*$/.test(value);
}

function isIdentifierLike(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(value);
}

function issue(path: string, message: string): SchemaIssue {
  return { path, message };
}

function failure(errors: SchemaIssue[]): SchemaParseFailure {
  return {
    success: false,
    errors,
    message: errors.map((error) => `${error.path}: ${error.message}`).join("; ")
  };
}
