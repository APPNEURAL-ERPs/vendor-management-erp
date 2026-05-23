import { HttpError } from "./errors";

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function ensureObject(value: unknown, name: string): Record<string, any> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  throw new HttpError(400, `${name} must be an object`);
}

export function optionalObject(value: unknown): Record<string, any> {
  if (value === undefined || value === null) return {};
  return ensureObject(value, "object");
}

export function ensureString(value: unknown, name: string, fallback?: string): string {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    throw new HttpError(400, `${name} is required`);
  }
  return String(value);
}

export function ensureNumber(value: unknown, name: string, fallback?: number): number {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    throw new HttpError(400, `${name} is required`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new HttpError(400, `${name} must be a number`);
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
  if (!Array.isArray(value)) throw new HttpError(400, `${name} must be an array`);
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

export function countBy(items: any[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function redact<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(
    JSON.stringify(value, (_, val) => {
      if (/secret|password|token|keyHash|encryptedValue|value|credential/i.test(String(_))) {
        return "***redacted***";
      }
      return val;
    })
  );
}

export function maskSecret(value: string): string {
  if (!value || value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(Math.max(8, value.length - 4))}${value.slice(-2)}`;
}

export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return "****";
  const prefix = key.includes("_") ? key.split("_")[0] + "_" : "";
  return `${prefix}${"*".repeat(8)}...${key.slice(-4)}`;
}
