import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { DocumentService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 6400);
const dbFile = process.env.DOCUMENTOS_DB_FILE ?? "data/documentos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().documents.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new DocumentService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`DocumentOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`Overview: http://localhost:${port}/overview`);
  console.log(`Documents: http://localhost:${port}/documents`);
  console.log(`Templates: http://localhost:${port}/templates`);
});
