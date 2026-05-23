export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function ensureString(value: unknown, field: string, fallback?: string): string {
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} is required`);
  }
  const str = String(value).trim();
  if (str === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} cannot be empty`);
  }
  return str;
}

export function ensureNumber(value: unknown, field: string, fallback?: number): number {
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} is required`);
  }
  const num = Number(value);
  if (isNaN(num)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} must be a valid number`);
  }
  return num;
}

export function ensureBoolean(value: unknown, fallback?: boolean): boolean {
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback;
    throw new Error("Value is required");
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (["true", "1", "yes", "y"].includes(lower)) return true;
    if (["false", "0", "no", "n"].includes(lower)) return false;
  }
  return Boolean(value);
}

export function ensureObject<T = Record<string, unknown>>(value: unknown, field: string): T {
  if (value === undefined || value === null) {
    throw new Error(`${field} is required`);
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value as T;
}

export function optionalObject<T = Record<string, unknown>>(value: unknown, fallback: T | undefined = undefined): T | undefined {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "object" || Array.isArray(value)) return fallback;
  return value as T;
}

export function ensureArray<T>(value: unknown, field: string, fallback: T[] = []): T[] {
  if (!Array.isArray(value)) return fallback;
  return value as T[];
}

export function pickQuery(params: URLSearchParams | undefined, key: string): string | undefined {
  if (!params) return undefined;
  const value = params.get(key);
  return value || undefined;
}

export function pickQueries(params: URLSearchParams | undefined, ...keys: string[]): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  if (!params) return result;
  for (const key of keys) {
    const value = params.get(key);
    result[key] = value || undefined;
  }
  return result;
}

export function getPathValue(obj: any, path: string): any {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

export function filterByDateRange<T extends { createdAt?: string; updatedAt?: string; issueDate?: string; dueDate?: string; expenseDate?: string; paidAt?: string }>(
  items: T[],
  params: URLSearchParams
): T[] {
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  
  if (!startDate && !endDate) return items;
  
  return items.filter(item => {
    const dateField = item.issueDate || item.expenseDate || item.dueDate || item.paidAt || item.createdAt;
    if (!dateField) return false;
    
    const date = new Date(dateField).getTime();
    
    if (startDate && date < new Date(startDate).getTime()) return false;
    if (endDate && date > new Date(endDate).getTime()) return false;
    
    return true;
  });
}

export function filterByStatus<T extends { status: string }>(
  items: T[],
  params: URLSearchParams
): T[] {
  const status = params.get("status");
  if (!status) return items;
  return items.filter(item => item.status === status);
}

export function filterBySearch<T>(
  items: T[],
  params: URLSearchParams,
  fields: string[]
): T[] {
  const search = params.get("search")?.toLowerCase();
  if (!search) return items;
  
  return items.filter(item => {
    return fields.some(field => {
      const value = getPathValue(item, field);
      if (value === undefined || value === null) return false;
      return String(value).toLowerCase().includes(search);
    });
  });
}

export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((total, item) => total + fn(item), 0);
}

export function averageBy<T>(items: T[], fn: (item: T) => number): number {
  if (items.length === 0) return 0;
  return sumBy(items, fn) / items.length;
}

export function countBy<T>(items: T[], key: keyof T): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function sortBy<T>(items: T[], key: keyof T, order: "asc" | "desc" = "asc"): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

export function paginate<T>(items: T[], params: URLSearchParams): T[] {
  const page = parseInt(params.get("page") || "1", 10);
  const limit = parseInt(params.get("limit") || "20", 10);
  const start = (page - 1) * limit;
  const end = start + limit;
  return items.slice(start, end);
}

export function includesText(value: unknown, query: string): boolean {
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
}
