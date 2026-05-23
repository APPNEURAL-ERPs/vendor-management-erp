const { DataStore } = require("../core/datastore");
const { createSeedState } = require("../seed-state");

const dbFile = process.env.PROCUREMENTOS_DB_FILE ?? "data/procurementos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
store.reset(createSeedState(tenantId));

console.log("ProcurementOS database seeded successfully");
console.log(`Database file: ${dbFile}`);
console.log(`Tenant ID: ${tenantId}`);
