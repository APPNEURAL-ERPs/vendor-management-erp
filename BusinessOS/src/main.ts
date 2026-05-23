import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { BusinessService } from "./services/business.service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 8000);
const dbFile = process.env.BUSINESSOS_DB_FILE ?? "data/businessos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().strategies.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new BusinessService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`BusinessOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
