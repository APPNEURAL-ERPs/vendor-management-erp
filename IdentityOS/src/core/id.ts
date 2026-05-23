import { createHash, randomBytes } from "crypto";

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function plusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function plusHours(hours: number): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + hours);
  return d.toISOString();
}

export function isExpired(expiresAt?: string): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(prefix = "tok"): string {
  return `${prefix}_${randomBytes(18).toString("hex")}`;
}

export function generateApiKey(prefix = "sk"): string {
  return `${prefix}_${randomBytes(24).toString("hex")}`;
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`;
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

export function generateTOTPSecret(): string {
  return randomBytes(20).toString("base32");
}

export function generateOTP(length = 6): string {
  let otp = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += (bytes[i] % 10).toString();
  }
  return otp;
}
