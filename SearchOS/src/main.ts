import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./routes";
import { SearchService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 6100);
const dbFile = process.env.SEARCHOS_DB_FILE ?? "data/searchos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().indexes.length === 0) {
  store.reset(createSeedState(tenantId));
  console.log(`SearchOS seeded with demo data for tenant: ${tenantId}`);
}

const service = new SearchService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`SearchOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`API:    http://localhost:${port}/search`);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down SearchOS...");
  server.close(() => {
    console.log("SearchOS closed");
    process.exit(0);
  });
});
