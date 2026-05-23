import { DataStore } from "../core/datastore";
import { createSeedState } from "../seed-state";

const dbFile = process.env.AUTOMATIONOS_DB_FILE ?? "data/automationos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";
const store = new DataStore(dbFile);
store.reset(createSeedState(tenantId));
console.log(`Seeded AutomationOS data into ${dbFile} for tenant ${tenantId}`);
