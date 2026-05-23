import { DataStore } from "../core/datastore";
import { createSeedState } from "../seed-state";

const file = process.env.DEVELOPEROS_DATA_FILE ?? process.env.DEVOS_DATA_FILE ?? "data/developeros.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";
const store = new DataStore(file);
store.reset(createSeedState(tenantId));
console.log(`Seeded DeveloperOS data for tenant ${tenantId} at ${file}`);
