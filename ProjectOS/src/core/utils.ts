export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function ensureString(value: unknown, field: string, fallback?: string): string {
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} is required`);
  }
  const str = String(value).trim();
  if (!str && fallback === undefined) {
    throw new Error(`${field} cannot be empty`);
  }
  return str || fallback || str;
}

export function ensureNumber(value: unknown, field: string, fallback?: number): number {
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} is required`);
  }
  const num = Number(value);
  if (isNaN(num)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} must be a number`);
  }
  return num;
}

export function ensureBoolean(value: unknown, fallback?: boolean): boolean {
  if (value === undefined || value === null) return fallback ?? false;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "yes", "y"].includes(value.toLowerCase());
  return Boolean(value);
}

export function ensureObject(value: unknown, field: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  throw new Error(`${field} must be an object`);
}

export function ensureArray<T = unknown>(value: unknown, field: string, fallback: T[] = []): T[] {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(value)) return value as T[];
  return fallback;
}

export function optionalObject(value: unknown): Record<string, unknown> {
  return ensureObject(value, "object");
}

export function pickQuery(params: URLSearchParams | undefined, key: string): string | undefined {
  if (!params) return undefined;
  const value = params.get(key);
  return value || undefined;
}

export function getPathValue(obj: any, path: string): unknown {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}
