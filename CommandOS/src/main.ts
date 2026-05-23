import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { EventBus } from "./core/event-bus";
import { Router } from "./core/http";
import { registerRoutes } from "./modules/routes";
import { CommandService } from "./services/command.service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 6700);
const dbFile = process.env.COMMANDOS_DB_FILE ?? "data/commandos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().commands.length === 0) {
  store.reset(createSeedState(tenantId));
}

const events = new EventBus(store);
const service = new CommandService(store, events);
const router = registerRoutes(new Router(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`CommandOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
