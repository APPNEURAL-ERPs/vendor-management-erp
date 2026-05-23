import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { WebsiteService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 9300);
const dbFile = process.env.WEBSITEOS_DB_FILE ?? "data/websiteos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().websites.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new WebsiteService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`WebsiteOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`Dashboard: http://localhost:${port}/dashboard`);
});
