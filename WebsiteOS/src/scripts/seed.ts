import { DataStore } from "../core/datastore";
import { createSeedState } from "../seed-state";

const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";
const dbFile = process.env.WEBSITEOS_DB_FILE ?? "data/websiteos.db.json";

const store = new DataStore(dbFile);
store.reset(createSeedState(tenantId));

console.log("✅ Database seeded successfully");
console.log(`📦 Database file: ${dbFile}`);
console.log(`👤 Tenant: ${tenantId}`);
