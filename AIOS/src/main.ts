import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { AiosService } from "./services/aios.service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 5700);
const dbFile = process.env.AIOS_DB_FILE ?? "data/aios.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().agents.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new AiosService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`AIOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
