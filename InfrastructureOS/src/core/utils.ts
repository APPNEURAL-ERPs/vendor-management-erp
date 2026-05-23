export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function ensureString(value: unknown, field: string, fallback?: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

export function ensureNumber(value: unknown, field: string, fallback?: number): number {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} is required`);
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`${field} must be a valid number`);
  }
  return n;
}

export function ensureBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.toLowerCase());
  }
  return Boolean(value);
}

export function ensureObject(value: unknown, field: string): Record<string, unknown> {
  if (value === undefined || value === null) {
    throw new Error(`${field} is required`);
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function ensureArray<T = unknown>(value: unknown, field: string, fallback?: T[]): T[] {
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback;
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }
  return value as T[];
}

export function optionalObject(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function pickQuery(params: URLSearchParams | undefined, key: string): string | undefined {
  if (!params) return undefined;
  const value = params.get(key);
  return value === null ? undefined : value || undefined;
}

export function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}

export function includesText(value: unknown, query: string): boolean {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}

export function redact<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(
    JSON.stringify(value, (key, val) => {
      if (/secret|password|token|keyHash|encryptedValue|connectionString/i.test(key)) {
        return "***redacted***";
      }
      return val;
    })
  );
}
