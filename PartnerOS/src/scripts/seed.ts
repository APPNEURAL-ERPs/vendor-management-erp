import { DataStore } from "../core/datastore";
import { createSeedState } from "../seed-state";

const dbFile = process.env.PARTNEROS_DB_FILE ?? "data/partneros.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
store.reset(createSeedState(tenantId));
console.log(`Seeded PartnerOS demo data for tenant '${tenantId}' into ${dbFile}`);
