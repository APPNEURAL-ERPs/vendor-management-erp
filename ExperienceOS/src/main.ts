import { createServer } from "http";
import { IncomingMessage, ServerResponse } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { ExperienceService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 9400);
const dbFile = process.env.EXPERIENCEOS_DB_FILE ?? "data/experienceos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().personas.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new ExperienceService(store);
const router = registerRoutes(new Router(), service);

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`ExperienceOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
