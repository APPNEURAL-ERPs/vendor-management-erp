import { DataStore } from "../core/datastore";
import { createSeedState } from "../seed-state";

const dbPath = process.env.ANALYTICSOS_DB_PATH ?? "./data/analyticsos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";
const store = new DataStore(dbPath);
store.reset(createSeedState(tenantId));
console.log(`Seeded AnalyticsOS demo data at ${dbPath} for tenant ${tenantId}`);
