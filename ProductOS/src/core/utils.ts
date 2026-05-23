import { badRequest } from "./errors";
export function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export function roundMoney(value: number): number { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
export function numberOrZero(value: unknown): number { const n = Number(value); return Number.isFinite(n) ? n : 0; }
export function requiredString(value: unknown, field: string): string { if (typeof value !== "string" || value.trim() === "") badRequest(`${field} is required`); return value.trim(); }
export function optionalString(value: unknown): string | undefined { return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined; }
export function assertDate(value: unknown, field: string): string { const text = requiredString(value, field); if (Number.isNaN(Date.parse(text))) badRequest(`${field} must be a valid date`); return text; }
export function pct(a: number, b: number): number { return b === 0 ? 0 : roundMoney((a / b) * 100); }
export function unique<T>(values: T[]): T[] { return [...new Set(values)]; }
