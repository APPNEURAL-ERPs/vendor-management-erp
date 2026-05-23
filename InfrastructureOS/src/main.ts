import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { InfrastructureService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";

const port = Number(process.env.PORT ?? 10500);
const dbFile = process.env.INFRAOS_DB_FILE ?? "data/infrastructureos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().environments.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new InfrastructureService(store);
const router = new Router();

router.get("/health", () => ({
  service: "InfrastructureOS",
  status: "ok",
  message: service.getRoutesSummary()
}));

router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

router.get("/infraos/overview", ({ actor }) => service.overview(actor));

router.get("/infraos/environments", ({ actor }) => service.listEnvironments(actor));
router.post("/infraos/environments", ({ body, actor }) => service.createEnvironment(body, actor));

router.get("/infraos/servers", ({ actor }) => service.listServers(actor));
router.post("/infraos/servers", ({ body, actor }) => service.createServer(body, actor));

router.get("/infraos/databases", ({ actor }) => service.listDatabases(actor));
router.post("/infraos/databases", ({ body, actor }) => service.createDatabase(body, actor));

router.get("/infraos/networks", ({ actor }) => service.listNetworks(actor));
router.post("/infraos/networks", ({ body, actor }) => service.createNetwork(body, actor));

router.get("/infraos/containers", ({ actor }) => service.listContainers(actor));
router.post("/infraos/containers", ({ body, actor }) => service.createContainer(body, actor));

router.get("/infraos/deployments", ({ actor }) => service.listDeployments(actor));
router.post("/infraos/deployments", ({ body, actor }) => service.createDeployment(body, actor));
router.post("/infraos/deployments/:id/run", ({ params, body, actor }) => service.runDeployment(params.id, body, actor));
router.post("/infraos/deployments/:id/rollback", ({ params, actor }) => service.rollbackDeployment(params.id, actor));

router.get("/infraos/deployment-runs", ({ actor }) => service.listDeploymentRuns(actor));

router.get("/infraos/events", ({ actor }) => service.listEvents(actor));
router.post("/infraos/events", ({ body, actor }) => service.emitEvent(String(body.type), String(body.source), body.data ?? {}, actor));

router.get("/infraos/audit", ({ actor }) => service.listAuditLogs(actor));

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`InfrastructureOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
