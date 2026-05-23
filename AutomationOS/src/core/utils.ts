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
  if (!Number.isFinite(num)) {
    throw new Error(`${field} must be a valid number`);
  }
  return num;
}

export function ensureBoolean(value: unknown, fallback?: boolean): boolean {
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback;
    return false;
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (["true", "1", "yes", "y"].includes(lower)) return true;
    if (["false", "0", "no", "n"].includes(lower)) return false;
  }
  return Boolean(value);
}

export function ensureArray<T = string>(value: unknown, field: string, fallback?: T[]): T[] {
  if (value === undefined || value === null) {
    return fallback || [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }
  return value as T[];
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

export function optionalObject(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function pickQuery(params: URLSearchParams | undefined, key: string): string | undefined {
  if (!params) return undefined;
  const value = params.get(key);
  return value || undefined;
}

export function getPathValue(obj: any, path: string): unknown {
  if (!path) return obj;
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

export function setPathValue(obj: any, path: string, value: unknown): void {
  const keys = path.split(".");
  const last = keys.pop();
  if (!last) return;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {};
    return current[key];
  }, obj);
  target[last] = value;
}
