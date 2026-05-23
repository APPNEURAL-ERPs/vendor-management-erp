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

export function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) return undefined;
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

export function getPathValue(input: any, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current === undefined || current === null) return undefined;
    return current[key];
  }, input);
}

export function setPathValue(input: any, path: string, value: unknown): any {
  const parts = path.split(".");
  let current = input;
  for (const part of parts.slice(0, -1)) {
    current[part] = current[part] ?? {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return input;
}

export function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function compact<T>(items: Array<T | undefined | null | false>): T[] {
  return items.filter(Boolean) as T[];
}

export function countBy(items: any[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const value = String(item[key]);
    if (!acc[value]) acc[value] = [];
    acc[value].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function filterByStatus<T extends { status: string }>(items: T[], status: string): T[] {
  if (!status || status === "all") return items;
  return items.filter(item => item.status === status);
}

export function searchItems<T>(items: T[], query: string, fields: (keyof T)[]): T[] {
  if (!query) return items;
  const lower = query.toLowerCase();
  return items.filter(item => 
    fields.some(field => {
      const value = item[field];
      return typeof value === "string" && value.toLowerCase().includes(lower);
    })
  );
}

export function sortBy<T>(items: T[], field: keyof T, order: "asc" | "desc" = "asc"): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}
