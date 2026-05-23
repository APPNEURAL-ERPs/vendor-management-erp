export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function ensureString(value: unknown, field: string, fallback?: string): string {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} is required`);
  }
  return String(value).trim();
}

export function ensureNumber(value: unknown, field: string, fallback?: number): number {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} is required`);
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Expected number for ${field}`);
  return n;
}

export function ensureBoolean(value: unknown, fallback?: boolean): boolean {
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback;
    return false;
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "yes", "y"].includes(value.toLowerCase());
  return Boolean(value);
}

export function ensureObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function optionalObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function ensureArray<T = unknown>(value: unknown, field: string, fallback?: T[]): T[] {
  if (!Array.isArray(value)) {
    if (fallback !== undefined) return fallback;
    return [];
  }
  return value as T[];
}

export function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}

export function pickQuery(params: URLSearchParams | undefined, key: string): string | undefined {
  if (!params) return undefined;
  const value = params.get(key);
  return value === null || value === "" ? undefined : value;
}

export function getPathValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function includesText(value: unknown, query: string): boolean {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}
