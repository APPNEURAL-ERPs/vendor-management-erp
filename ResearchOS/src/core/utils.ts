export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function asBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.toLowerCase());
  }
  return Boolean(value);
}

export function asNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
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

export function unique<T>(values: T[]): T[] {
  return [...new Set(values.map(v => String(v).trim()).filter(Boolean))] as T[];
}

export function includesText(value: unknown, query: string): boolean {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}

export function countBy<T>(items: T[], key: keyof T): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
