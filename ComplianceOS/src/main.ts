import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router, permissionsFor } from "./core/http";
import { ComplianceService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 9700);
const dbFile = process.env.COMPLIANCE_DB_FILE ?? "data/complianceos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().frameworks.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new ComplianceService(store);
const router = new Router();

router.get("/health", () => ({ service: "ComplianceOS", status: "ok", message: service.getRoutesSummary() }));
router.get("/docs", () => {
  const { docs } = require("./docs");
  return { ...docs(), routes: router.listRoutes() };
});
router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

router.get("/compliance/overview", ({ actor }) => service.overview(actor), "compliance.read");

router.get("/compliance/frameworks", ({ actor }) => service.listFrameworks(actor), "compliance.read");
router.get("/compliance/frameworks/:id", ({ params, actor }) => service.getFramework(params.id, actor), "compliance.read");
router.post("/compliance/frameworks", ({ body, actor }) => service.createFramework(body, actor), "compliance.write");

router.get("/compliance/controls", ({ actor, query }) => service.listControls(actor, query), "compliance.read");
router.get("/compliance/controls/:id", ({ params, actor }) => service.getControl(params.id, actor), "compliance.read");
router.post("/compliance/controls", ({ body, actor }) => service.createControl(body, actor), "compliance.write");
router.patch("/compliance/controls/:id", ({ params, body, actor }) => service.updateControl(params.id, body, actor), "compliance.write");

router.get("/compliance/audits", ({ actor, query }) => service.listAudits(actor, query), "compliance.read");
router.get("/compliance/audits/:id", ({ params, actor }) => service.getAudit(params.id, actor), "compliance.read");
router.post("/compliance/audits", ({ body, actor }) => service.createAudit(body, actor), "compliance.audit.execute");

router.get("/compliance/findings", ({ actor, query }) => service.listFindings(actor, query), "compliance.read");
router.post("/compliance/findings", ({ body, actor }) => service.createFinding(body, actor), "compliance.audit.execute");

router.get("/compliance/risks", ({ actor, query }) => service.listRisks(actor, query), "compliance.read");
router.get("/compliance/risks/:id", ({ params, actor }) => service.getRisk(params.id, actor), "compliance.read");
router.post("/compliance/risks", ({ body, actor }) => service.createRisk(body, actor), "compliance.write");

router.get("/compliance/evidences", ({ actor, query }) => service.listEvidences(actor, query), "compliance.read");
router.get("/compliance/evidences/:id", ({ params, actor }) => service.getEvidence(params.id, actor), "compliance.read");
router.post("/compliance/evidences", ({ body, actor }) => service.createEvidence(body, actor), "compliance.write");

router.get("/compliance/policies", ({ actor, query }) => service.listPolicies(actor, query), "compliance.read");
router.get("/compliance/policies/:id", ({ params, actor }) => service.getPolicy(params.id, actor), "compliance.read");
router.post("/compliance/policies", ({ body, actor }) => service.createPolicy(body, actor), "compliance.write");

router.get("/compliance/checklists", ({ actor, query }) => service.listChecklists(actor, query), "compliance.read");
router.post("/compliance/checklists", ({ body, actor }) => service.createChecklist(body, actor), "compliance.write");

router.get("/compliance/vendors", ({ actor, query }) => service.listVendorCompliances(actor, query), "compliance.read");
router.post("/compliance/vendors", ({ body, actor }) => service.createVendorCompliance(body, actor), "compliance.write");

router.get("/compliance/remediation-tasks", ({ actor, query }) => service.listRemediationTasks(actor, query), "compliance.read");
router.post("/compliance/remediation-tasks", ({ body, actor }) => service.createRemediationTask(body, actor), "compliance.write");

router.get("/compliance/audit", ({ actor }) => service.listAuditLogs(actor), "compliance.read");

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`ComplianceOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
