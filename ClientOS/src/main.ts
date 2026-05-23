import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { ClientService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";
import {
  HttpError,
  badRequest,
  asArray,
  asBoolean,
  asNumber,
  optionalString
} from "./core/utils";
import {
  IncomingMessage,
  ServerResponse
} from "http";
import { URL } from "url";
import { Role } from "./domain";

const port = Number(process.env.PORT ?? 8600);
const dbFile = process.env.CLIENTOS_DB_FILE ?? "data/clients.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().clients.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new ClientService(store);

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

interface RouteHandler {
  (req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: { tenantId: string; userId: string; role: Role }): Promise<unknown>;
}

const routes: Array<{ method: HttpMethod; path: string; handler: RouteHandler; permission?: string }> = [
  ["GET", "/health", handleHealth],
  ["GET", "/docs", handleDocs],

  ["GET", "/clientos/overview", handleOverview],

  ["GET", "/clientos/clients", handleListClients],
  ["POST", "/clientos/clients", handleCreateClient],
  ["GET", "/clientos/clients/:id", handleGetClient],
  ["PATCH", "/clientos/clients/:id", handleUpdateClient],
  ["DELETE", "/clientos/clients/:id", handleDeleteClient],

  ["GET", "/clientos/clients/:id/contacts", handleListContacts],
  ["POST", "/clientos/clients/:id/contacts", handleCreateContact],

  ["GET", "/clientos/clients/:id/projects", handleListProjects],
  ["POST", "/clientos/clients/:id/projects", handleCreateProject],

  ["GET", "/clientos/clients/:id/meetings", handleListClientMeetings],
  ["POST", "/clientos/clients/:id/meetings", handleCreateMeeting],

  ["GET", "/clientos/clients/:id/health", handleGetHealthScore],
  ["PUT", "/clientos/clients/:id/health", handleUpdateHealthScore],

  ["GET", "/clientos/clients/:id/success-plans", handleListSuccessPlans],
  ["POST", "/clientos/clients/:id/success-plans", handleCreateSuccessPlan],

  ["GET", "/clientos/clients/:id/support-tickets", handleListSupportTickets],
  ["POST", "/clientos/clients/:id/support-tickets", handleCreateSupportTicket],

  ["GET", "/clientos/clients/:id/invoices", handleListInvoices],
  ["POST", "/clientos/clients/:id/invoices", handleCreateInvoice],

  ["GET", "/clientos/clients/:id/risks", handleListRisks],
  ["POST", "/clientos/clients/:id/risks", handleCreateRisk],

  ["GET", "/clientos/meetings", handleListMeetings],
  ["PATCH", "/clientos/meetings/:id", handleUpdateMeeting],

  ["GET", "/clientos/deliverables", handleListDeliverables],
  ["POST", "/clientos/deliverables", handleCreateDeliverable],

  ["GET", "/clientos/health-scores", handleListHealthScores],

  ["GET", "/clientos/tasks", handleListTasks],
  ["POST", "/clientos/tasks", handleCreateTask],
];

async function handleHealth(req: IncomingMessage, res: ServerResponse): Promise<void> {
  sendJson(res, 200, { ok: true, service: "ClientOS", timestamp: new Date().toISOString() });
}

async function handleDocs(req: IncomingMessage, res: ServerResponse): Promise<void> {
  sendJson(res, 200, docs());
}

async function handleOverview(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const overview = service.getOverview(actor);
  sendJson(res, 200, overview);
}

async function handleListClients(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const url = new URL(req.url!, "http://localhost");
  const filters = {
    status: optionalString(url.searchParams.get("status")),
    search: optionalString(url.searchParams.get("search")),
    segment: optionalString(url.searchParams.get("segment")),
    tags: url.searchParams.getAll("tags")
  };
  const clients = service.listClients(actor, filters as any);
  sendJson(res, 200, clients);
}

async function handleCreateClient(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const client = service.createClient(actor, body);
  sendJson(res, 201, client);
}

async function handleGetClient(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const client = service.getClient(actor, params.id);
  sendJson(res, 200, client);
}

async function handleUpdateClient(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const client = service.updateClient(actor, params.id, body);
  sendJson(res, 200, client);
}

async function handleDeleteClient(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  service.deleteClient(actor, params.id);
  sendJson(res, 204, null);
}

async function handleListContacts(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const contacts = service.listContacts(actor, params.id);
  sendJson(res, 200, contacts);
}

async function handleCreateContact(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const contact = service.createContact(actor, params.id, body);
  sendJson(res, 201, contact);
}

async function handleListProjects(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const projects = service.listProjects(actor, params.id);
  sendJson(res, 200, projects);
}

async function handleCreateProject(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const project = service.createProject(actor, params.id, body);
  sendJson(res, 201, project);
}

async function handleListClientMeetings(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const meetings = service.listMeetings(actor, params.id);
  sendJson(res, 200, meetings);
}

async function handleListMeetings(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const url = new URL(req.url!, "http://localhost");
  const clientId = optionalString(url.searchParams.get("clientId"));
  const meetings = service.listMeetings(actor, clientId);
  sendJson(res, 200, meetings);
}

async function handleCreateMeeting(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const meeting = service.createMeeting(actor, body);
  sendJson(res, 201, meeting);
}

async function handleUpdateMeeting(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const meeting = service.updateMeeting(actor, params.id, body);
  sendJson(res, 200, meeting);
}

async function handleListDeliverables(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const url = new URL(req.url!, "http://localhost");
  const projectId = optionalString(url.searchParams.get("projectId"));
  const deliverables = service.listDeliverables(actor, projectId);
  sendJson(res, 200, deliverables);
}

async function handleCreateDeliverable(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const deliverable = service.createDeliverable(actor, body);
  sendJson(res, 201, deliverable);
}

async function handleGetHealthScore(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const health = service.getHealthScore(actor, params.id);
  if (!health) {
    sendJson(res, 404, { error: "Health score not found" });
    return;
  }
  sendJson(res, 200, health);
}

async function handleUpdateHealthScore(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const health = service.updateHealthScore(actor, params.id, body);
  sendJson(res, 200, health);
}

async function handleListHealthScores(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const url = new URL(req.url!, "http://localhost");
  const clientId = optionalString(url.searchParams.get("clientId"));
  const scores = service.listHealthScores(actor, clientId);
  sendJson(res, 200, scores);
}

async function handleListSuccessPlans(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const plans = service.listSuccessPlans(actor, params.id);
  sendJson(res, 200, plans);
}

async function handleCreateSuccessPlan(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const plan = service.createSuccessPlan(actor, params.id, body);
  sendJson(res, 201, plan);
}

async function handleListSupportTickets(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const tickets = service.listSupportTickets(actor, params.id);
  sendJson(res, 200, tickets);
}

async function handleCreateSupportTicket(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const ticket = service.createSupportTicket(actor, body);
  sendJson(res, 201, ticket);
}

async function handleListInvoices(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const invoices = service.listInvoices(actor, params.id);
  sendJson(res, 200, invoices);
}

async function handleCreateInvoice(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const invoice = service.createInvoice(actor, body);
  sendJson(res, 201, invoice);
}

async function handleListTasks(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const url = new URL(req.url!, "http://localhost");
  const filters = {
    projectId: optionalString(url.searchParams.get("projectId")),
    clientId: optionalString(url.searchParams.get("clientId")),
    status: optionalString(url.searchParams.get("status"))
  };
  const tasks = service.listTasks(actor, filters as any);
  sendJson(res, 200, tasks);
}

async function handleCreateTask(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const task = service.createTask(actor, body);
  sendJson(res, 201, task);
}

async function handleListRisks(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown, actor: any): Promise<void> {
  const risks = service.listRisks(actor, params.id);
  sendJson(res, 200, risks);
}

async function handleCreateRisk(req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any, actor: any): Promise<void> {
  const risk = service.createRisk(actor, body);
  sendJson(res, 201, risk);
}

function compilePath(path: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexSource = path.split("/").map((part) => {
    if (part.startsWith(":")) {
      paramNames.push(part.slice(1));
      return "([^/]+)";
    }
    return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("/");
  return { regex: new RegExp(`^${regexSource}$`), paramNames };
}

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  const method = String(req.method ?? "GET").toUpperCase();
  if (["GET", "DELETE", "OPTIONS"].includes(method)) return undefined;
  const chunks: string[] = [];
  for await (const chunk of req) chunks.push(String(chunk));
  const raw = chunks.join("").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
}

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers[name] ?? req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0] as string;
  return typeof raw === "string" ? raw : undefined;
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-tenant-id,x-user-id");
  res.end(JSON.stringify(payload, null, 2));
}

function handleError(res: ServerResponse, error: unknown): void {
  if (error instanceof HttpError) {
    sendJson(res, error.statusCode, { ok: false, error: error.message, details: error.details });
    return;
  }
  sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : "Internal server error" });
}

const compiledRoutes = routes.map(route => ({
  ...route,
  ...compilePath(route.path)
}));

const server = createServer(async (req, res) => {
  try {
    const method = String(req.method ?? "GET").toUpperCase() as HttpMethod;
    if (method === "OPTIONS") {
      sendJson(res, 200, { ok: true });
      return;
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;

    const route = compiledRoutes.find(r => r.method === method && r.regex.test(path));
    if (!route) {
      sendJson(res, 404, { ok: false, error: "Route not found", method, path });
      return;
    }

    const match = route.regex.exec(path)!;
    const params: Record<string, string> = {};
    route.paramNames.forEach((name, index) => {
      params[name] = decodeURIComponent(match[index + 1] ?? "");
    });

    const roleHeader = getHeader(req, "x-role") ?? "viewer";
    const actor = {
      tenantId: getHeader(req, "x-tenant-id") ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant",
      userId: getHeader(req, "x-user-id") ?? `${roleHeader}-user`,
      role: roleHeader as Role
    };

    const body = await parseJsonBody(req);
    const result = await route.handler(req, res, params, body, actor);

    if (!res.headersSent) {
      sendJson(res, 200, { ok: true, data: result ?? null });
    }
  } catch (error) {
    handleError(res, error);
  }
});

server.listen(port, () => {
  console.log(`ClientOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`API:    http://localhost:${port}/clientos`);
});
