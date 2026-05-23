let counter = 0;
export function nowIso(): string { return new Date().toISOString(); }
export function newId(prefix: string): string { counter += 1; return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`; }
