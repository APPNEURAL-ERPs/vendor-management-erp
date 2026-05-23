import { HttpError } from "./errors";

export type JsonResponse = unknown;

export function sendJson(res: any, statusCode: number, payload: JsonResponse): void {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,x-tenant-id,x-user-id,x-role"
  });
  res.end(JSON.stringify(payload, null, 2));
}

export async function readJson(req: any): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

export function sendError(res: any, error: unknown): void {
  if (error instanceof HttpError) { sendJson(res, error.statusCode, { error: error.message, details: error.details }); return; }
  if (error && typeof error === "object" && "statusCode" in error) {
    const candidate = error as { statusCode?: number; message?: string };
    sendJson(res, candidate.statusCode ?? 500, { error: candidate.message ?? "Request failed" });
    return;
  }
  sendJson(res, 500, { error: error instanceof Error ? error.message : "Internal server error" });
}
