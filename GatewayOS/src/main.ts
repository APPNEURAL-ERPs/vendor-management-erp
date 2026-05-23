import { createServer } from "http";
import http from "http";
import https from "https";
import { DataStore } from "./core/datastore";
import { badRequest, notFound } from "./core/errors";
import { readJson, sendError, sendJson } from "./core/http";
import { GatewayService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";
import { RequestActor, Role } from "./domain";

const roles: Role[] = ["owner", "admin", "gateway_admin", "gateway_operator", "viewer"];
const port = Number(process.env.PORT ?? 10714);
const dbFile = process.env.GATEWAYOS_DB_FILE ?? "data/gatewayos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";
const platformUrl = String(process.env.PLATFORMOS_URL ?? "http://localhost:5000");
const catalogTtlMs = Number(process.env.GATEWAY_CATALOG_TTL_MS ?? 5000);

function actorFrom(req: any): RequestActor { const role = String(req.headers["x-role"] ?? "owner") as Role; if (!roles.includes(role)) badRequest("Unsupported role '" + role + "'"); return { tenantId: String(req.headers["x-tenant-id"] ?? tenantId), userId: String(req.headers["x-user-id"] ?? "demo-user"), role }; }
function pathParts(pathname: string): string[] { return pathname.split("/").filter(Boolean); }

const store = new DataStore(dbFile);
if (store.getState().items.length === 0) store.reset(createSeedState(tenantId));
const service = new GatewayService(store);

type ServiceCatalogEntry = {
  key: string;
  name: string;
  baseUrl?: string;
  api?: { basePath?: string; standalonePath?: string; docsPath?: string };
  runtime?: { port?: number; localBaseUrl?: string };
};

let cachedCatalog: { at: number; items: ServiceCatalogEntry[] } | undefined;

function stripHopByHopHeaders(headers: Record<string, any>): Record<string, any> {
  const deny = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade", "host"]);
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (deny.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

async function readBody(req: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function requestJson(urlString: string, headers: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const client = url.protocol === "https:" ? https : http;
    const req = client.request(
      {
        method: "GET",
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: stripHopByHopHeaders(headers)
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf-8");
          try {
            resolve(JSON.parse(raw));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function getCatalog(req: any): Promise<ServiceCatalogEntry[]> {
  const now = Date.now();
  if (cachedCatalog && now - cachedCatalog.at < catalogTtlMs) return cachedCatalog.items;
  const payload = await requestJson(platformUrl.replace(/\/+$/, "") + "/platformos/catalog", req.headers ?? {});
  const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  cachedCatalog = { at: now, items };
  return items;
}

function bestMatch(pathname: string, catalog: ServiceCatalogEntry[]): { entry: ServiceCatalogEntry; basePath: string } | undefined {
  let best: { entry: ServiceCatalogEntry; basePath: string } | undefined;
  for (const entry of catalog) {
    if (entry.key === "gatewayos") continue;
    const basePath = String(entry.api?.basePath ?? "");
    if (!basePath || !pathname.startsWith(basePath)) continue;
    if (!best || basePath.length > best.basePath.length) best = { entry, basePath };
  }
  return best;
}

async function proxyToService(req: any, res: any, url: URL): Promise<void> {
  const catalog = await getCatalog(req);
  const match = bestMatch(url.pathname, catalog);
  if (!match) { notFound("Route not found"); return; }
  const baseUrl = match.entry.baseUrl ?? match.entry.runtime?.localBaseUrl;
  if (!baseUrl) { badRequest("Target service baseUrl not registered in PlatformOS"); return; }

  const rest = url.pathname.slice(match.basePath.length);
  const standalonePath = String(match.entry.api?.standalonePath ?? `/${match.entry.key}`);
  const target = new URL(baseUrl.replace(/\/+$/, "") + standalonePath + (rest.startsWith("/") ? rest : "/" + rest) + url.search);

  const body = await readBody(req);
  await new Promise<void>((resolve, reject) => {
    const client = target.protocol === "https:" ? https : http;
    const outReq = client.request(
      {
        method: req.method,
        hostname: target.hostname,
        port: target.port,
        path: target.pathname + target.search,
        headers: { ...stripHopByHopHeaders(req.headers ?? {}), "content-length": body.length }
      },
      (outRes) => {
        const headers = stripHopByHopHeaders(outRes.headers as any);
        res.writeHead(outRes.statusCode ?? 502, headers);
        outRes.pipe(res);
        outRes.on("end", () => resolve());
      }
    );
    outReq.on("error", reject);
    if (body.length) outReq.write(body);
    outReq.end();
  });
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") { sendJson(res, 204, null); return; }
    const url = new URL(req.url ?? "/", "http://" + (req.headers.host ?? "localhost"));
    const parts = pathParts(url.pathname); const actor = actorFrom(req);
    if (req.method === "GET" && url.pathname === "/health") { sendJson(res, 200, { service: "GatewayOS", status: "ok", message: service.getRoutesSummary() }); return; }
    if (req.method === "GET" && url.pathname === "/docs") { sendJson(res, 200, docs()); return; }
    if (url.pathname.startsWith("/v1/") && !url.pathname.startsWith("/v1/gateway")) { await proxyToService(req, res, url); return; }
    if (parts[0] !== "gatewayos") notFound("Route not found");
    if (req.method === "GET" && parts[1] === "overview") sendJson(res, 200, service.overview(actor));
    else if (req.method === "GET" && parts[1] === "items" && parts.length === 2) sendJson(res, 200, service.listItems(actor, url.searchParams));
    else if (req.method === "POST" && parts[1] === "items" && parts.length === 2) sendJson(res, 201, service.createItem(await readJson(req), actor));
    else if (req.method === "GET" && parts[1] === "items" && parts[2]) sendJson(res, 200, service.getItem(parts[2], actor));
    else if (req.method === "PATCH" && parts[1] === "items" && parts[2]) sendJson(res, 200, service.updateItem(parts[2], await readJson(req), actor));
    else if (req.method === "DELETE" && parts[1] === "items" && parts[2]) sendJson(res, 200, service.archiveItem(parts[2], actor));
    else if (req.method === "GET" && parts[1] === "runs") sendJson(res, 200, service.listRuns(actor));
    else if (req.method === "POST" && parts[1] === "runs") sendJson(res, 201, service.createRun(await readJson(req), actor));
    else if (req.method === "GET" && parts[1] === "events") sendJson(res, 200, service.listEvents(actor));
    else if (req.method === "GET" && parts[1] === "audit") sendJson(res, 200, service.listAuditLogs(actor));
    else notFound("Route not found");
  } catch (error) { sendError(res, error); }
});

server.listen(port, () => { console.log("GatewayOS listening on http://localhost:" + port); });
