import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./routes";
import { KnowledgeService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 7200);
const dbFile = process.env.KNOWLEDGEOS_DB_FILE ?? "data/knowledgeos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().spaces.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new KnowledgeService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`KnowledgeOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
