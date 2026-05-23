import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { ContentService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 9200);
const dbFile = process.env.CONTENTOS_DB_FILE ?? "data/contentos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().strategies.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new ContentService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`ContentOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
