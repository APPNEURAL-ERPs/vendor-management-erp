import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { FinanceService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";
import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

const port = Number(process.env.PORT ?? 8300);
const dbFile = process.env.FINANCEOS_DB_FILE ?? "data/financeos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().invoices.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new FinanceService(store);

const server = createServer((req, res) => {
  const method = String(req.method ?? "GET").toUpperCase();
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-role, x-tenant-id, x-user-id");

  if (method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const role = req.headers["x-role"] as string || "viewer";
  const actor = {
    tenantId: (req.headers["x-tenant-id"] as string) || tenantId,
    userId: (req.headers["x-user-id"] as string) || `${role}-user`,
    role: role as any
  };

  try {
    if (path === "/health" && method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, service: "FinanceOS", timestamp: new Date().toISOString() }, null, 2));
      return;
    }

    if (path === "/docs" && method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify(docs(), null, 2));
      return;
    }

    if (path === "/financeos" && method === "GET") {
      const overview = service.overview(actor);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: overview }, null, 2));
      return;
    }

    if (path === "/financeos/invoices" && method === "GET") {
      const invoices = service.listInvoices(actor, url.searchParams);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: invoices }, null, 2));
      return;
    }

    if (path === "/financeos/invoices" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const invoice = service.createInvoice(JSON.parse(body), actor);
          res.writeHead(201);
          res.end(JSON.stringify({ ok: true, data: invoice }, null, 2));
        } catch (error: any) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, error: error.message }));
        }
      });
      return;
    }

    if (path.match(/^\/financeos\/invoices\/[^/]+$/) && method === "GET") {
      const id = path.split("/")[3];
      try {
        const invoice = service.getInvoice(id, actor);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, data: invoice }, null, 2));
      } catch (error: any) {
        res.writeHead(404);
        res.end(JSON.stringify({ ok: false, error: error.message }));
      }
      return;
    }

    if (path.match(/^\/financeos\/invoices\/[^/]+$/) && method === "PATCH") {
      const id = path.split("/")[3];
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const invoice = service.updateInvoice(id, JSON.parse(body), actor);
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true, data: invoice }, null, 2));
        } catch (error: any) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, error: error.message }));
        }
      });
      return;
    }

    if (path.match(/^\/financeos\/invoices\/[^/]+$/) && method === "DELETE") {
      const id = path.split("/")[3];
      try {
        service.deleteInvoice(id, actor);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, message: "Invoice deleted" }));
      } catch (error: any) {
        res.writeHead(404);
        res.end(JSON.stringify({ ok: false, error: error.message }));
      }
      return;
    }

    if (path === "/financeos/payments" && method === "GET") {
      const payments = service.listPayments(actor, url.searchParams);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: payments }, null, 2));
      return;
    }

    if (path === "/financeos/payments" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const payment = service.createPayment(JSON.parse(body), actor);
          res.writeHead(201);
          res.end(JSON.stringify({ ok: true, data: payment }, null, 2));
        } catch (error: any) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, error: error.message }));
        }
      });
      return;
    }

    if (path === "/financeos/expenses" && method === "GET") {
      const expenses = service.listExpenses(actor, url.searchParams);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: expenses }, null, 2));
      return;
    }

    if (path === "/financeos/expenses" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const expense = service.createExpense(JSON.parse(body), actor);
          res.writeHead(201);
          res.end(JSON.stringify({ ok: true, data: expense }, null, 2));
        } catch (error: any) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, error: error.message }));
        }
      });
      return;
    }

    if (path === "/financeos/budgets" && method === "GET") {
      const budgets = service.listBudgets(actor, url.searchParams);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: budgets }, null, 2));
      return;
    }

    if (path === "/financeos/budgets" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const budget = service.createBudget(JSON.parse(body), actor);
          res.writeHead(201);
          res.end(JSON.stringify({ ok: true, data: budget }, null, 2));
        } catch (error: any) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, error: error.message }));
        }
      });
      return;
    }

    if (path === "/financeos/quotations" && method === "GET") {
      const quotations = service.listQuotations(actor, url.searchParams);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: quotations }, null, 2));
      return;
    }

    if (path === "/financeos/quotations" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const quotation = service.createQuotation(JSON.parse(body), actor);
          res.writeHead(201);
          res.end(JSON.stringify({ ok: true, data: quotation }, null, 2));
        } catch (error: any) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, error: error.message }));
        }
      });
      return;
    }

    if (path === "/financeos/receivables" && method === "GET") {
      const receivables = service.getReceivables(actor, url.searchParams);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: receivables }, null, 2));
      return;
    }

    if (path === "/financeos/payables" && method === "GET") {
      const payables = service.getPayables(actor, url.searchParams);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: payables }, null, 2));
      return;
    }

    if (path === "/financeos/health-score" && method === "GET") {
      const healthScore = service.calculateHealthScore(actor);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: healthScore }, null, 2));
      return;
    }

    if (path.startsWith("/financeos/reports/") && method === "GET") {
      const parts = path.split("/");
      const reportType = parts[3];
      const startDate = url.searchParams.get("startDate") || undefined;
      const endDate = url.searchParams.get("endDate") || undefined;
      try {
        const report = service.generateReport(actor, reportType, startDate, endDate);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, data: report }, null, 2));
      } catch (error: any) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: error.message }));
      }
      return;
    }

    if (path === "/financeos/revenue-streams" && method === "GET") {
      const streams = service.listRevenueStreams(actor);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: streams }, null, 2));
      return;
    }

    if (path === "/financeos/tax-records" && method === "GET") {
      const records = service.listTaxRecords(actor);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: records }, null, 2));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ ok: false, error: "Route not found", method, path }));
  } catch (error: any) {
    res.writeHead(500);
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
});

server.listen(port, () => {
  console.log(`FinanceOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`Overview: http://localhost:${port}/financeos`);
});
