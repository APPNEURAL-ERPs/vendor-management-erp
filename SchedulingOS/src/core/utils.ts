export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function badRequest(message: string, details?: unknown): never {
  throw new HttpError(400, message, details);
}

export function notFound(message: string, details?: unknown): never {
  throw new HttpError(404, message, details);
}

export function conflict(message: string, details?: unknown): never {
  throw new HttpError(409, message, details);
}

export function ensureObject(value: unknown, name: string): Record<string, any> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  badRequest(`${name} must be an object`);
}

export function optionalObject(value: unknown): Record<string, any> {
  if (value === undefined || value === null) return {};
  return ensureObject(value, "object");
}

export function ensureString(value: unknown, name: string, fallback?: string): string {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    badRequest(`${name} is required`);
  }
  return String(value);
}

export function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

export function ensureNumber(value: unknown, name: string, fallback?: number): number {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    badRequest(`${name} is required`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) badRequest(`${name} must be a number`);
  return number;
}

export function ensureBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return Boolean(value);
}

export function ensureArray<T = any>(value: unknown, name: string, fallback: T[] = []): T[] {
  if (value === undefined || value === null) return fallback;
  if (!Array.isArray(value)) badRequest(`${name} must be an array`);
  return value as T[];
}

export function ensureEnum<T extends string>(
  value: unknown,
  name: string,
  allowed: T[],
  fallback?: T
): T {
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback;
    badRequest(`${name} is required`);
  }
  const strValue = String(value) as T;
  if (!allowed.includes(strValue)) {
    badRequest(`${name} must be one of: ${allowed.join(", ")}`);
  }
  return strValue;
}

export function pickQuery(query: URLSearchParams | undefined, key: string): string | undefined {
  const value = query?.get(key) ?? undefined;
  return value === "" ? undefined : value;
}

export function pickNumberQuery(query: URLSearchParams | undefined, key: string, fallback?: number): number | undefined {
  const value = query?.get(key);
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function pickBoolQuery(query: URLSearchParams | undefined, key: string, fallback = false): boolean {
  const value = query?.get(key);
  if (value === null || value === undefined) return fallback;
  return ["true", "1", "yes", "y"].includes(value.toLowerCase());
}

export function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function compact<T>(items: Array<T | undefined | null | false>): T[] {
  return items.filter(Boolean) as T[];
}

export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const groupKey = String(item[key]);
    acc[groupKey] = acc[groupKey] ?? [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function countBy<T>(items: T[], key: keyof T): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly details?: unknown) {
    super(message);
  }
}
