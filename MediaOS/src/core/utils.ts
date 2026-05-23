export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function ensureString(value: unknown, field: string, fallback?: string): string {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} is required`);
  }
  return String(value);
}

export function ensureNumber(value: unknown, field: string, fallback?: number): number {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} is required`);
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${field} must be a number`);
  return n;
}

export function ensureBoolean(value: unknown, fallback?: boolean): boolean {
  if (value === undefined || value === null) return fallback ?? false;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "yes", "y"].includes(value.toLowerCase());
  return Boolean(value);
}

export function ensureArray<T = unknown>(value: unknown, field: string, fallback?: T[]): T[] {
  if (value === undefined || value === null) return fallback ?? [];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  return value as T[];
}

export function optionalObject(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

export function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}

export function includesText(value: unknown, query: string): boolean {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}

export function isExpired(expiresAt?: string): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export function pickQuery(params: URLSearchParams | undefined, key: string): string | undefined {
  if (!params) return undefined;
  const value = params.get(key);
  return value === null || value === "" ? undefined : value;
}

export function getPathValue(obj: any, path: string): unknown {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

export function countBy(items: any[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
