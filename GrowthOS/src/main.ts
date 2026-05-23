import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { EventBus } from "./core/event-bus";
import { GrowthService } from "./services/growth.service";
import { registerRoutes } from "./modules/routes";

const PORT = Number(process.env.PORT ?? 8800);
const DB_FILE = process.env.GROWTHOS_DB ?? "data/growthos.db.json";

const store = new DataStore(DB_FILE);
const events = new EventBus(store);

if (store.getState().campaigns.length === 0) {
  console.log("Seeding initial state...");
  const { createSeedState } = require("./seed-state");
  const seed = createSeedState();
  store.reset(seed);
}

const service = new GrowthService(store, events);
const router = registerRoutes(new (require("./core/http").Router)(), service);

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(PORT, () => {
  console.log(`GrowthOS running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Docs:   http://localhost:${PORT}/docs`);
});
