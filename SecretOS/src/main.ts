import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { SecretOSService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 5400);
const dbFile = process.env.SECRETOS_DB_FILE ?? "data/secretos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().secrets.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new SecretOSService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`SecretOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`Dashboard: http://localhost:${port}/secretos/dashboard`);
});
