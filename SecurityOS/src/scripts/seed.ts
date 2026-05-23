import { DataStore } from "../core";
import { createSeedState } from "../seed-state";
const dbFile = process.env.SECURITYOS_DB_FILE ?? "data/securityos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";
const store = new DataStore(dbFile);
store.reset(createSeedState(tenantId));
console.log(`Seeded SecurityOS demo data for tenant ${tenantId} into ${dbFile}`);
