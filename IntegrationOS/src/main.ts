import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { IntegrationService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 10400);
const dbFile = process.env.INTEGRATIONOS_DB_FILE ?? "data/integrationos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().connectors.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new IntegrationService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`IntegrationOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
