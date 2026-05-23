export function nowIso(): string {
  return new Date().toISOString();
}

export function plusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
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
  return Array.isArray(value) ? value as T[] : [];
}

export function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}

export function includesText(value: unknown, query: string): boolean {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}

export function normalizeSlug(value: unknown): string {
  const str = requireString(value, "slug");
  return str.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function isExpired(expiresAt?: string): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export function calculateSEOscore(seo: { metaTitle?: string; metaDescription?: string; keywords?: string[]; ogImage?: string; schemaMarkup?: unknown[] }): number {
  let score = 0;
  if (seo.metaTitle && seo.metaTitle.length >= 30 && seo.metaTitle.length <= 60) score += 25;
  else if (seo.metaTitle) score += 15;
  if (seo.metaDescription && seo.metaDescription.length >= 120 && seo.metaDescription.length <= 160) score += 25;
  else if (seo.metaDescription) score += 15;
  if (seo.keywords && seo.keywords.length > 0 && seo.keywords.length <= 10) score += 20;
  else if (seo.keywords && seo.keywords.length > 0) score += 10;
  if (seo.ogImage) score += 15;
  if (seo.schemaMarkup && seo.schemaMarkup.length > 0) score += 15;
  return Math.min(100, score);
}

export function calculateConversionRate(conversions: number, views: number): number {
  if (views === 0) return 0;
  return Math.round((conversions / views) * 10000) / 100;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
