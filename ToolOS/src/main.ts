import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { EventBus } from "./core/event-bus";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { createSeedState } from "./seed-state";
import { ToolService } from "./services/tool.service";

const port = Number(process.env.PORT ?? 6700);
const dbFile = process.env.TOOLOS_DB_FILE ?? "data/toolos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().tools.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new ToolService(store, new EventBus(store));
const router = registerRoutes(new Router(), service);
const server = createServer((req, res) => router.handle(req, res));

server.listen(port, () => {
  console.log(`ToolOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
