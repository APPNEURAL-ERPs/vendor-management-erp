export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${random}`;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(String(text).trim().split(/\s+/).filter(Boolean).length * 1.25));
}

export function generateStepId(stepName: string): string {
  const cleaned = stepName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `${cleaned}_${Date.now().toString(36).slice(-4)}`;
}
