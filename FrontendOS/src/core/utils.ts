import { badRequest } from "./errors";

export function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }

export function ensureString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) badRequest(fieldName + " is required");
  return value.trim();
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function ensureArray<T = unknown>(value: unknown, fieldName: string): T[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) badRequest(fieldName + " must be an array");
  return value as T[];
}

export function ensureObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) badRequest(fieldName + " must be an object");
  return value as Record<string, unknown>;
}

export function optionalObject(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  return ensureObject(value, "metadata");
}

export function pickQuery(query: URLSearchParams | undefined, key: string): string | undefined {
  const value = query?.get(key);
  return value === null || value === "" ? undefined : value;
}
