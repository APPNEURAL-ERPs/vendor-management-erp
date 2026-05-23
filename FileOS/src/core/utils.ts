export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function badRequest(message: string, details?: unknown): never {
  throw new HttpError(400, message, details);
}

export function notFound(message: string, details?: unknown): never {
  throw new HttpError(404, message, details);
}

export function forbidden(message: string, details?: unknown): never {
  throw new HttpError(403, message, details);
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
  enumValues: T[],
  fallback?: T
): T {
  const strValue = String(value ?? "");
  if (strValue && enumValues.includes(strValue as T)) return strValue as T;
  if (fallback !== undefined) return fallback;
  badRequest(`${name} must be one of: ${enumValues.join(", ")}`);
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

export function countBy<T>(items: T[], key: keyof T): Record<string, number> {
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

export function redact<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value, (k, val) => 
    /secret|password|token|keyHash|encryptedValue|accessKeyId|secretKey/i.test(k) 
      ? "***redacted***" 
      : val
  ));
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/__+/g, "_");
}

export function normalizePath(path: string): string {
  return "/" + path.replace(/\/+/g, "/").replace(/\/$/, "").replace(/^\//, "");
}

export function buildFolderPath(parentPath: string | undefined, folderName: string): string {
  const base = parentPath || "";
  return normalizePath(`${base}/${folderName}`);
}
