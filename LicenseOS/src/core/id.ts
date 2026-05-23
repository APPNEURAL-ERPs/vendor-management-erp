export type ISODate = string;

export function nowIso(): ISODate {
  return new Date().toISOString();
}

export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function plusDays(days: number): ISODate {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function plusMonths(months: number): ISODate {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

export function isExpired(expiresAt?: ISODate): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export function isExpiringSoon(expiresAt?: ISODate, daysThreshold = 30): boolean {
  if (!expiresAt) return false;
  const expiryDate = new Date(expiresAt).getTime();
  const now = Date.now();
  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
  return expiryDate > now && expiryDate - now <= thresholdMs;
}

export function daysUntilExpiry(expiresAt?: ISODate): number {
  if (!expiresAt) return Infinity;
  const expiryDate = new Date(expiresAt).getTime();
  const now = Date.now();
  return Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000));
}

export function generateLicenseKey(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}

export function generateApiKey(prefix = "sk"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = `${prefix}_`;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
