import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router, registerRoutes } from "./routes";
import { SupportService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 8900);
const dbFile = process.env.SUPPORTOS_DB_FILE ?? "data/supportos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().tickets.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new SupportService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`SupportOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`API:    http://localhost:${port}/supportos/overview`);
});
