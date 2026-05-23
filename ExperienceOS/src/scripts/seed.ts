import { DataStore } from "../core/datastore";
import { createSeedState } from "../seed-state";

const dbFile = process.env.EXPERIENCEOS_DB_FILE ?? "data/experienceos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";
const store = new DataStore(dbFile);
store.reset(createSeedState(tenantId));
console.log(`Seeded ExperienceOS data for tenant ${tenantId} into ${dbFile}`);
