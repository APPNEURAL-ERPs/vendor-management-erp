import { DataStore } from "../core/datastore";
import { createSeedState } from "../seed-state";

const dbFile = process.env.VENDOROS_DB_FILE ?? "data/vendoros.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";
const store = new DataStore(dbFile);
store.reset(createSeedState(tenantId));
console.log("Seeded VendorOS at " + dbFile);
