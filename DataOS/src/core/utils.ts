export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

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

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    badRequest(`${field} is required`);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return String(value);
}

export function asNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    badRequest(`Expected number for ${String(value)}`);
  }
  return n;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.toLowerCase());
  }
  return Boolean(value);
}

export function asArray<T = string>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}

export function includesText(value: unknown, query: string): boolean {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}

export function normalizeEmail(value: unknown): string {
  return requireString(value, "email").toLowerCase();
}

export function matchPattern(pattern: string, value: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) return value.startsWith(pattern.slice(0, -1));
  return pattern === value;
}

export function redact<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(
    JSON.stringify(value, (key, val) =>
      /secret|password|token|keyHash|encryptedValue|value/i.test(key)
        ? "***redacted***"
        : val
    )
  );
}

export function countBy(items: any[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
