import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { SalesService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 8500);
const dbFile = process.env.SALESOS_DB_FILE ?? "data/salesos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().leads.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new SalesService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`SalesOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
