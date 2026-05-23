import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { NotificationService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 5900);
const dbFile = process.env.NOTIFICATIONOS_DB_FILE ?? "data/notificationos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().notifications.length === 0) {
  store.reset(createSeedState(tenantId));
  console.log("NotificationOS seeded with demo data");
}

const service = new NotificationService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`NotificationOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`API:    http://localhost:${port}/notificationos/overview`);
});
