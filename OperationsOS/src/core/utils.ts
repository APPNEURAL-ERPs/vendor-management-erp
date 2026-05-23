import { badRequest } from "./errors";

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
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

export function compact<T>(items: Array<T | undefined | null | false>): T[] {
  return items.filter(Boolean) as T[];
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

export function daysUntil(date?: string): number {
  if (!date) return Infinity;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
