{
  "name": "@appneurox/operationsos",
  "version": "1.0.0",
  "description": "OperationsOS: operating cadence, processes, tasks, resources, incidents, SOPs, and cross-team execution",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/main.js",
    "dev": "npm run build && node dist/main.js",
    "seed": "npm run build && node dist/scripts/seed.js",
    "reset": "rm -f data/operationsos.db.json && npm run seed",
    "test": "npm run build && node --test tests/*.test.cjs"
  },
  "license": "MIT",
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "@appneural/os-core": "file:../../APPNEURAL-Packages/os-core",
    "@appneural/os-http": "file:../../APPNEURAL-Packages/os-http",
    "@appneural/os-store": "file:../../APPNEURAL-Packages/os-store",
    "@appneural/os-events": "file:../../APPNEURAL-Packages/os-events",
    "@appneural/os-security": "file:../../APPNEURAL-Packages/os-security",
    "@appneural/os-audit": "file:../../APPNEURAL-Packages/os-audit",
    "@appneural/os-config": "file:../../APPNEURAL-Packages/os-config",
    "@appneural/os-validation": "file:../../APPNEURAL-Packages/os-validation",
    "@appneural/os-docs": "file:../../APPNEURAL-Packages/os-docs",
    "@appneural/os-testing": "file:../../APPNEURAL-Packages/os-testing",
    "@appneural/os-types": "file:../../APPNEURAL-Packages/os-types"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^22.7.5"
  },
  "keywords": [
    "appneurox",
    "operationsos",
    "operating-system",
    "sdk",
    "tasks",
    "processes",
    "sops",
    "incidents",
    "resources"
  ],
  "appneurox": {
    "os": "operationsos",
    "domain": "operations",
    "modes": [
      "standalone",
      "platform"
    ],
    "manifest": "./manifest.json"
  }
}
