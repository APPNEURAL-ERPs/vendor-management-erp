import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { AutomationService } from "./service";
import { createSeedState } from "./seed-state";
import { AutomationRouter } from "./router";

const port = Number(process.env.PORT ?? 7100);
const dbFile = process.env.AUTOMATIONOS_DB_FILE ?? "data/automationos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().workflows.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new AutomationService(store);
const router = new AutomationRouter(service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`AutomationOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
