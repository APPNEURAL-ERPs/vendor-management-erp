import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { badRequest, notFound } from "./core/errors";
import { readJson, sendError, sendJson } from "./core/http";
import { TaskService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";
import { RequestActor, Role } from "./domain";

const roles: Role[] = ["owner", "admin", "task_admin", "task_operator", "viewer"];
const port = Number(process.env.PORT ?? 10716);
const dbFile = process.env.TASKOS_DB_FILE ?? "data/taskos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

function actorFrom(req: any): RequestActor { const role = String(req.headers["x-role"] ?? "owner") as Role; if (!roles.includes(role)) badRequest("Unsupported role '" + role + "'"); return { tenantId: String(req.headers["x-tenant-id"] ?? tenantId), userId: String(req.headers["x-user-id"] ?? "demo-user"), role }; }
function pathParts(pathname: string): string[] { return pathname.split("/").filter(Boolean); }

const store = new DataStore(dbFile);
if (store.getState().items.length === 0) store.reset(createSeedState(tenantId));
const service = new TaskService(store);

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") { sendJson(res, 204, null); return; }
    const url = new URL(req.url ?? "/", "http://" + (req.headers.host ?? "localhost"));
    const parts = pathParts(url.pathname); const actor = actorFrom(req);
    if (req.method === "GET" && url.pathname === "/health") { sendJson(res, 200, { service: "TaskOS", status: "ok", message: service.getRoutesSummary() }); return; }
    if (req.method === "GET" && url.pathname === "/docs") { sendJson(res, 200, docs()); return; }
    if (parts[0] !== "taskos") notFound("Route not found");
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

server.listen(port, () => { console.log("TaskOS listening on http://localhost:" + port); });
