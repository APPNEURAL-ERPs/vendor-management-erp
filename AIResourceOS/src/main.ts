import { createServer } from "http";
import { DataStore, EventBus } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./routes";
import { AIResourceService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 12200);
const dbFile = process.env.AIRESOURCEOS_DB_FILE ?? "data/airesourceos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().models.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new AIResourceService(store, new EventBus(store));
const router = registerRoutes(new Router(), service);

const server = createServer((req: any, res: any) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`AIResourceOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
