export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function unique<T>(values: T[]): T[] {
  return [...new Set(values.map((v) => JSON.stringify(v)).map((v) => JSON.parse(v)))];
}

export function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}

export function includesText(value: unknown, query: string): boolean {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}

export function normalizeEmail(value: unknown): string {
  const email = requireString(value, "email");
  return email.toLowerCase().trim();
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
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
  if (!Number.isFinite(n)) throw new Error(`Expected number for ${String(value)}`);
  return n;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "yes", "y"].includes(value.toLowerCase());
  return Boolean(value);
}

export function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export function matchPattern(pattern: string, value: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith("*")) return value.startsWith(pattern.slice(0, -1));
  return pattern === value;
}

export function redact<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(
    JSON.stringify(value, (key, val) => {
      if (/secret|password|token|keyHash|encryptedValue|value|phone/i.test(key)) {
        return "***redacted***";
      }
      return val;
    })
  );
}

export function countBy<T extends Record<string, unknown>>(items: T[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key] ?? "undefined");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function groupBy<T extends Record<string, unknown>>(items: T[], key: string): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const value = String(item[key] ?? "undefined");
    if (!acc[value]) acc[value] = [];
    acc[value].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function paginate<T>(items: T[], page = 1, pageSize = 20): { items: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    total,
    page,
    pageSize,
    totalPages
  };
}

export function filterByQuery<T extends Record<string, unknown>>(items: T[], query: string, fields: string[]): T[] {
  if (!query) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      return typeof value === "string" && value.toLowerCase().includes(lowerQuery);
    })
  );
}

export function sortBy<T>(items: T[], field: keyof T, order: "asc" | "desc" = "asc"): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal === bVal) return 0;
    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;
    const comparison = aVal < bVal ? -1 : 1;
    return order === "asc" ? comparison : -comparison;
  });
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
}

export function generateDeviceFingerprint(ipAddress?: string, userAgent?: string): string {
  const data = `${ipAddress ?? ""}-${userAgent ?? ""}-${Date.now()}`;
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
}
