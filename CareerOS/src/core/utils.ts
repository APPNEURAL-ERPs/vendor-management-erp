export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function badRequest(message: string, details?: unknown): never {
  throw new HttpError(400, message, details);
}

export function notFound(message: string, details?: unknown): never {
  throw new HttpError(404, message, details);
}

export function forbidden(message = "Forbidden"): never {
  throw new HttpError(403, message);
}

export function conflict(message = "Conflict", details?: unknown): never {
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

export function ensureObject(value: unknown, name: string): Record<string, any> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  badRequest(`${name} must be an object`);
}

export function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

export function pickQuery(query: URLSearchParams | undefined, key: string): string | undefined {
  const value = query?.get(key) ?? undefined;
  return value === "" ? undefined : value;
}

export function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeSkill(skill: string): string {
  return String(skill).toLowerCase().trim().replace(/\s+/g, " ");
}

export function normalizeCode(code: string, _fallback: string): string {
  return String(code).toUpperCase().replace(/[^A-Z0-9_-]/g, "_").slice(0, 20);
}

export function normalizeSkillArray(input: unknown, _name: string): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return (input as string[]).map(normalizeSkill).filter(Boolean);
  return [normalizeSkill(String(input))];
}

export function normalizeStringArray(input: unknown, _name: string): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return (input as string[]).map(String).map(s => s.trim()).filter(Boolean);
  return [String(input).trim()].filter(Boolean);
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function asIso(value: unknown, _field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function parseNumberQuery(query: URLSearchParams | undefined, key: string, fallback: number): number {
  const value = query?.get(key);
  if (!value) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function toRecord<T extends string>(keys: readonly T[]): Record<T, number> {
  return keys.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<T, number>);
}
