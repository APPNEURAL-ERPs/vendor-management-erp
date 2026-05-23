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

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function assertRequired(value: unknown, name: string): void {
  if (value === undefined || value === null || value === "") {
    badRequest(`${name} is required`);
  }
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

export function pickQuery(query: URLSearchParams | undefined, key: string): string | undefined {
  const value = query?.get(key) ?? undefined;
  return value === "" ? undefined : value;
}

export function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export const unique = uniq;

export function includesText(value: unknown, query: string): boolean {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}

export function normalizeEmail(value: unknown): string {
  return String(value).toLowerCase().trim();
}

export function numberOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function sum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function addDays(date: Date | string, days: number): string {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function valueAtPath(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}
