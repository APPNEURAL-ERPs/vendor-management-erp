import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { EventBus } from "./core/event-bus";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { CareerService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 10200);
const dbFile = process.env.CAREEROS_DB_FILE ?? "data/careeros.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
const events = new EventBus(store);

if (store.getState().jobs.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new CareerService(store, events);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`CareerOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
