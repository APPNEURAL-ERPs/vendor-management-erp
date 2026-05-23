import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { OperationsService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 8100);
const dbFile = process.env.OPS_DB_FILE ?? "data/operationsos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().tasks.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new OperationsService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`OperationsOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`Overview: http://localhost:${port}/operations/overview`);
  console.log(`Tasks: http://localhost:${port}/operations/tasks`);
});
