export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function badRequest(message: string, details?: unknown): never {
  const error = new Error(message) as Error & { statusCode?: number; details?: unknown };
  error.statusCode = 400;
  error.details = details;
  throw error;
}

export function notFound(message: string, details?: unknown): never {
  const error = new Error(message) as Error & { statusCode?: number; details?: unknown };
  error.statusCode = 404;
  error.details = details;
  throw error;
}

export function forbidden(message: string, details?: unknown): never {
  const error = new Error(message) as Error & { statusCode?: number; details?: unknown };
  error.statusCode = 403;
  error.details = details;
  throw error;
}

export function conflict(message: string, details?: unknown): never {
  const error = new Error(message) as Error & { statusCode?: number; details?: unknown };
  error.statusCode = 409;
  error.details = details;
  throw error;
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
  return Array.isArray(value) ? value as T[] : [];
}

export function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}

export function includesText(value: unknown, query: string): boolean {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}

export function countBy(items: any[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string): T[] {
  return items.filter((item) => item.tenantId === tenantId);
}

export function redact<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }
  return JSON.parse(
    JSON.stringify(value, (key, val) =>
      /secret|password|token|keyHash|encryptedValue|content/i.test(key)
        ? "***redacted***"
        : val
    )
  );
}
