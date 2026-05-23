import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { EventosService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 5800);
const dbFile = process.env.EVENTOS_DB_FILE ?? "data/eventos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().schemas.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new EventosService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`EventOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});

function registerRoutes(router: Router, service: EventosService): Router {
  router.get("/health", () => ({ service: "EventOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ service: "EventOS", version: "1.0.0", routes: router.listRoutes() }));

  router.get("/eventos/overview", ({ actor }) => service.overview(actor), "event.read");

  router.get("/eventos/events", ({ actor, query }) => service.listEvents(actor, query), "event.read");
  router.get("/eventos/events/:id", ({ params, actor }) => service.getEvent(params.id, actor), "event.read");
  router.post("/eventos/events/publish", ({ body, actor }) => service.publishEvent(body, actor), "event.publish");

  router.get("/eventos/schemas", ({ actor, query }) => service.listSchemas(actor, query), "event.schema.read");
  router.get("/eventos/schemas/:id", ({ params, actor }) => service.getSchema(params.id, actor), "event.schema.read");
  router.post("/eventos/schemas", ({ body, actor }) => service.createSchema(body, actor), "event.schema.write");

  router.get("/eventos/streams", ({ actor }) => service.listStreams(actor), "event.read");
  router.post("/eventos/streams", ({ body, actor }) => service.createStream(body, actor), "event.write");

  router.get("/eventos/publishers", ({ actor }) => service.listPublishers(actor), "event.read");
  router.post("/eventos/publishers", ({ body, actor }) => service.createPublisher(body, actor), "event.write");

  router.get("/eventos/subscribers", ({ actor }) => service.listSubscribers(actor), "event.read");
  router.post("/eventos/subscribers", ({ body, actor }) => service.createSubscriber(body, actor), "event.write");

  router.get("/eventos/subscriptions", ({ actor, query }) => service.listSubscriptions(actor, query), "event.subscribe");
  router.post("/eventos/subscriptions", ({ body, actor }) => service.createSubscription(body, actor), "event.subscribe");

  router.get("/eventos/webhooks", ({ actor }) => service.listWebhooks(actor), "event.read");
  router.post("/eventos/webhooks", ({ body, actor }) => service.createWebhook(body, actor), "event.write");

  router.get("/eventos/dead-letter", ({ actor, query }) => service.listDeadLetters(actor, query), "event.read");
  router.post("/eventos/dead-letter/:id/retry", ({ params, actor }) => service.retryDeadLetter(params.id, actor), "event.replay");
  router.post("/eventos/dead-letter/:id/resolve", ({ params, actor }) => service.resolveDeadLetter(params.id, actor), "event.write");

  router.get("/eventos/replays", ({ actor }) => service.listReplays(actor), "event.read");
  router.post("/eventos/replays", ({ body, actor }) => service.createReplay(body, actor), "event.replay");
  router.post("/eventos/replays/:id/execute", ({ params, actor }) => service.executeReplay(params.id, actor), "event.replay");

  router.get("/eventos/correlations/:correlationId", ({ params, actor }) => service.getCorrelation(params.correlationId, actor), "event.read");
  router.get("/eventos/logs", ({ actor, query }) => service.listEventLogs(actor, query), "event.read");

  router.get("/eventos/audit", ({ actor }) => service.listAuditLogs(actor), "event.audit.read");

  return router;
}
