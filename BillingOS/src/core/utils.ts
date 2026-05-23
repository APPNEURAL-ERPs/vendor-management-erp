import { newId, nowIso } from "./id";

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
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

export function asNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    badRequest(`Expected number for ${String(value)}`);
  }
  return n;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
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

export function isExpired(expiresAt?: string): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export function redact<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(
    JSON.stringify(value, (key, val) =>
      /secret|password|token|keyHash|encryptedValue|value|cardNumber|cvv/i.test(key)
        ? "***redacted***"
        : val
    )
  );
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

export function calculateTax(
  amount: number,
  taxRate: number,
  state?: string
): { cgst: number; sgst: number; igst: number; totalTax: number } {
  const igst = amount * (taxRate / 100);
  const cgst = state ? igst / 2 : 0;
  const sgst = state ? igst / 2 : 0;
  return {
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    totalTax: Math.round(igst * 100) / 100,
  };
}

export function calculateDiscount(
  amount: number,
  discountType: "percentage" | "fixed",
  discountValue: number
): number {
  if (discountType === "percentage") {
    return Math.round((amount * discountValue) / 100 * 100) / 100;
  }
  return Math.round(discountValue * 100) / 100;
}

export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
