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

export function ensureEnum<T>(value: unknown, enumValues: T[], name: string): T {
  if (!enumValues.includes(value as T)) {
    badRequest(`${name} must be one of: ${enumValues.join(", ")}`);
  }
  return value as T;
}

export function optionalEnum<T>(value: unknown, enumValues: T[], name: string): T | undefined {
  if (value === undefined || value === null) return undefined;
  return ensureEnum(value, enumValues, name);
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

export function countBy<T>(items: T[], key: keyof T | ((item: T) => string)): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = typeof key === "function" ? key(item) : String(item[key]);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function groupBy<T>(items: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const value = typeof key === "function" ? key(item) : String(item[key]);
    if (!acc[value]) acc[value] = [];
    acc[value].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T {
  let inThrottle = false;
  return ((...args: any[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9._-]/gi, "_").replace(/__+/g, "_");
}

export function matchPattern(pattern: string, value: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) return value.startsWith(pattern.slice(0, -1));
  if (pattern.includes("*")) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(value);
  }
  return pattern === value;
}
