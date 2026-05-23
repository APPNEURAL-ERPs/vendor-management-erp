import { badRequest } from "./errors";

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function ensureString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    badRequest(`${fieldName} is required`);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function ensureNumber(value: unknown, fieldName: string, fallback?: number): number {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    badRequest(`${fieldName} is required`);
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) badRequest(`${fieldName} must be a valid number`);
  return numberValue;
}

export function ensureBoolean(value: unknown, fieldName: string, fallback?: boolean): boolean {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    badRequest(`${fieldName} is required`);
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (["true", "1", "yes"].includes(value.toLowerCase())) return true;
    if (["false", "0", "no"].includes(value.toLowerCase())) return false;
  }
  badRequest(`${fieldName} must be a boolean`);
}

export function ensureArray<T = unknown>(value: unknown, fieldName: string): T[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) badRequest(`${fieldName} must be an array`);
  return value as T[];
}

export function ensureObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) badRequest(`${fieldName} must be an object`);
  return value as Record<string, unknown>;
}

export function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function normalizeStringArray(value: unknown, fieldName: string): string[] {
  return unique(ensureArray<string>(value, fieldName).map((item) => String(item).trim()).filter(Boolean));
}

export function normalizeCode(value: unknown, fieldName = "code"): string {
  return ensureString(value, fieldName).toUpperCase().replace(/[^A-Z0-9_-]/g, "_");
}

export function pickQuery(query: URLSearchParams, key: string): string | undefined {
  const value = query.get(key);
  return value === null || value === "" ? undefined : value;
}

export function parseNumberQuery(query: URLSearchParams, key: string, fallback?: number): number | undefined {
  const value = pickQuery(query, key);
  if (value === undefined) return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function asIso(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) badRequest(`${fieldName} must be a valid date`);
  return date.toISOString();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
