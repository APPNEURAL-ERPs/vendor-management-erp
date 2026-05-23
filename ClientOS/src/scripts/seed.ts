import { DataStore } from "../core/datastore";
import { createSeedState } from "../seed-state";

const dbFile = process.env.CLIENTOS_DB_FILE ?? "data/clientos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";
const store = new DataStore(dbFile);
store.reset(createSeedState(tenantId));
console.log(`Seeded ClientOS demo data for tenant ${tenantId} into ${dbFile}`);
