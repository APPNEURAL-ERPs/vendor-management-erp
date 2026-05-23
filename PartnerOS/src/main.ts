import { createServer, IncomingMessage, ServerResponse } from "http";
import { DataStore } from "./core/datastore";
import { PartnerService } from "./service";
import { createSeedState } from "./seed-state";
import { getDocs } from "./docs";
import { nowIso } from "./core/id";

const port = Number(process.env.PORT ?? 10000);
const dbFile = process.env.PARTNEROS_DB_FILE ?? "data/partneros.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().partners.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new PartnerService(store);

const startTime = Date.now();

interface Route {
  method: string;
  path: string;
  handler: (req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any) => Promise<void>;
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-tenant-id,x-user-id,x-role");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.end(JSON.stringify(payload, null, 2));
}

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const chunks: string[] = [];
    req.on("data", (chunk) => chunks.push(String(chunk)));
    req.on("end", () => {
      const raw = chunks.join("");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers[name] ?? req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0] as string;
  return typeof raw === "string" ? raw : undefined;
}

function getActor(req: IncomingMessage) {
  return {
    tenantId: getHeader(req, "x-tenant-id") ?? tenantId,
    userId: getHeader(req, "x-user-id") ?? "anonymous",
    role: (getHeader(req, "x-role") as any) ?? "viewer"
  };
}

const routes: Route[] = [
  {
    method: "GET",
    path: "/health",
    handler: async (req, res) => {
      sendJson(res, 200, {
        ok: true,
        status: "healthy",
        service: "PartnerOS",
        timestamp: nowIso(),
        uptime: Math.floor((Date.now() - startTime) / 1000)
      });
    }
  },
  {
    method: "GET",
    path: "/docs",
    handler: async (req, res) => {
      sendJson(res, 200, getDocs());
    }
  },
  {
    method: "GET",
    path: "/overview",
    handler: async (req, res) => {
      const actor = getActor(req);
      const overview = service.getOverview(actor.tenantId);
      sendJson(res, 200, { ok: true, data: overview });
    }
  },
  {
    method: "GET",
    path: "/partners",
    handler: async (req, res) => {
      const actor = getActor(req);
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const filters = {
        status: url.searchParams.get("status") ?? undefined,
        type: url.searchParams.get("type") ?? undefined,
        programId: url.searchParams.get("programId") ?? undefined,
        search: url.searchParams.get("search") ?? undefined
      };
      const partners = service.listPartners(actor.tenantId, filters);
      sendJson(res, 200, { ok: true, data: partners, count: partners.length });
    }
  },
  {
    method: "POST",
    path: "/partners",
    handler: async (req, res) => {
      const actor = getActor(req);
      const body = await parseBody(req);
      const partner = service.createPartner(actor, body);
      sendJson(res, 201, { ok: true, data: partner });
    }
  },
  {
    method: "GET",
    path: "/partners/:id",
    handler: async (req, res, params) => {
      const actor = getActor(req);
      const partner = service.getPartner(actor.tenantId, params.id);
      if (!partner) {
        sendJson(res, 404, { ok: false, error: "Partner not found" });
        return;
      }
      sendJson(res, 200, { ok: true, data: partner });
    }
  },
  {
    method: "PATCH",
    path: "/partners/:id",
    handler: async (req, res, params) => {
      const actor = getActor(req);
      const body = await parseBody(req);
      try {
        const partner = service.updatePartner(actor, params.id, body);
        sendJson(res, 200, { ok: true, data: partner });
      } catch (error) {
        sendJson(res, 404, { ok: false, error: (error as Error).message });
      }
    }
  },
  {
    method: "GET",
    path: "/partners/:id/health",
    handler: async (req, res, params) => {
      const actor = getActor(req);
      const health = service.calculatePartnerHealthScore(actor.tenantId, params.id);
      if (!health) {
        sendJson(res, 404, { ok: false, error: "Partner not found" });
        return;
      }
      sendJson(res, 200, { ok: true, data: health });
    }
  },
  {
    method: "GET",
    path: "/partners/:id/leads",
    handler: async (req, res, params) => {
      const actor = getActor(req);
      const leads = service.listLeads(actor.tenantId, { partnerId: params.id });
      sendJson(res, 200, { ok: true, data: leads, count: leads.length });
    }
  },
  {
    method: "GET",
    path: "/partners/:id/commissions",
    handler: async (req, res, params) => {
      const actor = getActor(req);
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const commissions = service.listCommissions(actor.tenantId, {
        partnerId: params.id,
        status: url.searchParams.get("status") ?? undefined
      });
      sendJson(res, 200, { ok: true, data: commissions, count: commissions.length });
    }
  },
  {
    method: "GET",
    path: "/programs",
    handler: async (req, res) => {
      const actor = getActor(req);
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const programs = service.listPrograms(actor.tenantId, {
        type: url.searchParams.get("type") ?? undefined,
        status: url.searchParams.get("status") ?? undefined
      });
      sendJson(res, 200, { ok: true, data: programs, count: programs.length });
    }
  },
  {
    method: "GET",
    path: "/programs/:id",
    handler: async (req, res, params) => {
      const actor = getActor(req);
      const program = service.getProgram(actor.tenantId, params.id);
      if (!program) {
        sendJson(res, 404, { ok: false, error: "Program not found" });
        return;
      }
      sendJson(res, 200, { ok: true, data: program });
    }
  },
  {
    method: "GET",
    path: "/tiers",
    handler: async (req, res) => {
      const actor = getActor(req);
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const tiers = service.listTiers(actor.tenantId, url.searchParams.get("programId") ?? undefined);
      sendJson(res, 200, { ok: true, data: tiers, count: tiers.length });
    }
  },
  {
    method: "GET",
    path: "/leads",
    handler: async (req, res) => {
      const actor = getActor(req);
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const leads = service.listLeads(actor.tenantId, {
        partnerId: url.searchParams.get("partnerId") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        source: url.searchParams.get("source") ?? undefined
      });
      sendJson(res, 200, { ok: true, data: leads, count: leads.length });
    }
  },
  {
    method: "POST",
    path: "/leads",
    handler: async (req, res) => {
      const actor = getActor(req);
      const body = await parseBody(req);
      const lead = service.submitLead(actor, body);
      sendJson(res, 201, { ok: true, data: lead });
    }
  },
  {
    method: "PATCH",
    path: "/leads/:id/status",
    handler: async (req, res, params) => {
      const actor = getActor(req);
      const body = await parseBody(req);
      try {
        const lead = service.updateLeadStatus(actor, params.id, body.status);
        sendJson(res, 200, { ok: true, data: lead });
      } catch (error) {
        sendJson(res, 404, { ok: false, error: (error as Error).message });
      }
    }
  },
  {
    method: "GET",
    path: "/commissions",
    handler: async (req, res) => {
      const actor = getActor(req);
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const commissions = service.listCommissions(actor.tenantId, {
        partnerId: url.searchParams.get("partnerId") ?? undefined,
        status: url.searchParams.get("status") ?? undefined
      });
      sendJson(res, 200, { ok: true, data: commissions, count: commissions.length });
    }
  },
  {
    method: "POST",
    path: "/commissions/calculate",
    handler: async (req, res) => {
      const actor = getActor(req);
      const body = await parseBody(req);
      try {
        const commission = service.calculateCommission(actor, body.dealId);
        sendJson(res, 201, { ok: true, data: commission });
      } catch (error) {
        sendJson(res, 404, { ok: false, error: (error as Error).message });
      }
    }
  },
  {
    method: "GET",
    path: "/payouts",
    handler: async (req, res) => {
      const actor = getActor(req);
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const payouts = service.listPayouts(actor.tenantId, {
        partnerId: url.searchParams.get("partnerId") ?? undefined,
        status: url.searchParams.get("status") ?? undefined
      });
      sendJson(res, 200, { ok: true, data: payouts, count: payouts.length });
    }
  },
  {
    method: "GET",
    path: "/campaigns",
    handler: async (req, res) => {
      const actor = getActor(req);
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const campaigns = service.listCampaigns(actor.tenantId, {
        status: url.searchParams.get("status") ?? undefined
      });
      sendJson(res, 200, { ok: true, data: campaigns, count: campaigns.length });
    }
  },
  {
    method: "GET",
    path: "/jointgtm",
    handler: async (req, res) => {
      const actor = getActor(req);
      const jointgtms = service.listJointGTMs(actor.tenantId);
      sendJson(res, 200, { ok: true, data: jointgtms, count: jointgtms.length });
    }
  },
  {
    method: "GET",
    path: "/enablement",
    handler: async (req, res) => {
      const actor = getActor(req);
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const enablements = service.listEnablements(
        actor.tenantId,
        url.searchParams.get("partnerId") ?? undefined
      );
      sendJson(res, 200, { ok: true, data: enablements, count: enablements.length });
    }
  },
  {
    method: "GET",
    path: "/search",
    handler: async (req, res) => {
      const actor = getActor(req);
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const query = url.searchParams.get("q") ?? "";
      const partners = service.searchPartners(actor.tenantId, query);
      sendJson(res, 200, { ok: true, data: partners, count: partners.length });
    }
  }
];

function matchRoute(method: string, path: string): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method && route.method !== "OPTIONS") continue;

    const routeParts = route.path.split("/");
    const pathParts = path.split("/");

    if (routeParts.length !== pathParts.length) continue;

    const params: Record<string, string> = {};
    let match = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) return { route, params };
  }
  return null;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const method = (req.method ?? "GET").toUpperCase();

    if (method === "OPTIONS") {
      sendJson(res, 200, { ok: true });
      return;
    }

    const matched = matchRoute(method, url.pathname);

    if (!matched) {
      sendJson(res, 404, {
        ok: false,
        error: "Route not found",
        method,
        path: url.pathname,
        availableEndpoints: routes.map(r => `${r.method} ${r.path}`)
      });
      return;
    }

    const body = method !== "GET" ? await parseBody(req) : {};
    await matched.route.handler(req, res, matched.params, body);
  } catch (error) {
    console.error("Server error:", error);
    sendJson(res, 500, {
      ok: false,
      error: "Internal server error",
      message: (error as Error).message
    });
  }
});

server.listen(port, () => {
  console.log(`PartnerOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`Overview: http://localhost:${port}/overview`);
  console.log(`Partners: http://localhost:${port}/partners`);
});
