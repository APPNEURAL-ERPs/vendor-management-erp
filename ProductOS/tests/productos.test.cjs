const assert = require('node:assert/strict');
const test = require('node:test');
const { unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { DataStore } = require('../dist/core/datastore.js');
const { EventBus } = require('../dist/core/event-bus.js');
const { ProductService } = require('../dist/services/product.service.js');
const { createSeedState } = require('../dist/seed-state.js');
const { hasPermission } = require('../dist/core/security.js');

function makeService() {
  const file = join(process.cwd(), 'data', `productos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState('test-tenant'));
  const service = new ProductService(store, new EventBus(store));
  const actor = { tenantId: 'test-tenant', userId: 'tester', role: 'product_admin' };
  return { service, actor, file };
}
function cleanup(file) { try { unlinkSync(file); } catch {} }

test('ProductOS seed overview returns lifecycle analytics', () => {
  const { service, actor, file } = makeService();
  const overview = service.overview(actor);
  assert.equal(overview.counts.products, 3);
  assert.equal(overview.counts.versions, 3);
  assert.equal(overview.counts.features, 4);
  assert.equal(overview.analytics.activeProducts, 3);
  assert.equal(overview.analytics.launchedProducts, 1);
  assert.equal(overview.analytics.totalBomCost, 8450);
  assert.ok(overview.topFeaturePriorities.length > 0);
  cleanup(file);
});

test('ProductOS creates product, version, requirement, feature, roadmap, and backlog item', () => {
  const { service, actor, file } = makeService();
  const product = service.createProduct(actor, { productCode: 'INTELLISTRA', name: 'Intellistra', type: 'software', ownerId: 'pm_dev', tags: ['ai', 'knowledge'] });
  const version = service.createVersion(actor, { productId: product.id, version: '0.1.0', name: 'Private Alpha', releaseDate: '2026-09-01' });
  const requirement = service.createRequirement(actor, { productId: product.id, title: 'Knowledge search', description: 'Users need semantic knowledge search.', source: 'customer', priority: 'high' });
  assert.equal(service.approveRequirement(actor, requirement.id).status, 'approved');
  const feature = service.createFeature(actor, { productId: product.id, requirementId: requirement.id, title: 'Semantic Search', ownerId: 'eng_dev', priority: 'high', effortPoints: 5, valueScore: 80, riskScore: 12 });
  const roadmap = service.createRoadmapItem(actor, { productId: product.id, title: 'Alpha roadmap', quarter: '2026-Q3', ownerId: 'pm_dev', linkedFeatureIds: [feature.id] });
  const backlog = service.createBacklogItem(actor, { productId: product.id, featureId: feature.id, title: 'Implement vector query', type: 'task', effortPoints: 3 });
  assert.equal(version.productId, product.id);
  assert.equal(roadmap.linkedFeatureIds[0], feature.id);
  assert.equal(service.updateBacklogStatus(actor, backlog.id, 'done').status, 'done');
  cleanup(file);
});

test('ProductOS creates BOMs, calculates costs, approves, and activates', () => {
  const { service, actor, file } = makeService();
  const component = service.createComponent(actor, { sku: 'CASE-001', name: 'Device Case', category: 'hardware', unit: 'piece', unitCost: 220, currency: 'INR' });
  const bom = service.createBOM(actor, { productId: 'prod_devicekit', name: 'DeviceKit Case BOM', lines: [{ componentId: component.id, quantity: 3 }] });
  assert.equal(bom.totalCost, 660);
  assert.equal(bom.lines[0].sku, 'CASE-001');
  assert.equal(service.approveBOM(actor, bom.id).status, 'approved');
  assert.equal(service.activateBOM(actor, bom.id).status, 'active');
  const boms = service.listBOMs(actor, { productId: 'prod_devicekit' });
  assert.equal(boms.filter((item) => item.status === 'active').length, 1);
  cleanup(file);
});

test('ProductOS release publishing releases features, version, and product lifecycle', () => {
  const { service, actor, file } = makeService();
  const feature = service.createFeature(actor, { productId: 'prod_devicekit', title: 'Prototype Checklist', ownerId: 'eng_hw', priority: 'medium', effortPoints: 2, valueScore: 50 });
  const version = service.createVersion(actor, { productId: 'prod_devicekit', version: '0.2.0', name: 'Prototype Beta', releaseDate: '2026-10-01' });
  const release = service.createRelease(actor, { productId: 'prod_devicekit', versionId: version.id, name: 'Prototype Beta Release', plannedDate: '2026-10-01', featureIds: [feature.id] });
  assert.equal(service.approveRelease(actor, release.id).status, 'approved');
  assert.equal(service.scheduleRelease(actor, release.id).status, 'scheduled');
  const published = service.publishRelease(actor, release.id);
  assert.equal(published.status, 'released');
  assert.equal(service.getFeature(actor, feature.id).status, 'released');
  assert.equal(service.getVersion(actor, version.id).status, 'released');
  assert.equal(service.getProduct(actor, 'prod_devicekit').lifecycleStage, 'launched');
  cleanup(file);
});

test('ProductOS manages change requests through approval and implementation', () => {
  const { service, actor, file } = makeService();
  const change = service.createChangeRequest(actor, { productId: 'prod_appneurox', targetType: 'feature', targetId: 'feat_usage_dashboard', title: 'Add cohort analysis', reason: 'Enterprise users need cohort retention reporting.', impact: 'high' });
  assert.equal(change.status, 'submitted');
  assert.equal(service.approveChangeRequest(actor, change.id).status, 'approved');
  assert.equal(service.implementChangeRequest(actor, change.id).status, 'implemented');
  cleanup(file);
});

test('ProductOS records events and audit logs', () => {
  const { service, actor, file } = makeService();
  const product = service.createProduct(actor, { productCode: 'CLOUDLYUP', name: 'CloudlyUp', type: 'service', ownerId: 'pm_cloud' });
  const events = service.listEvents(actor);
  const auditLogs = service.listAuditLogs(actor);
  assert.ok(events.some((event) => event.event === 'product.created' && event.data.productId === product.id));
  assert.ok(auditLogs.some((log) => log.action === 'product.create' && log.entityId === product.id));
  cleanup(file);
});

test('ProductOS permissions protect product operations by role', () => {
  assert.equal(hasPermission('viewer', 'product.products.write'), false);
  assert.equal(hasPermission('product_manager', 'product.features.write'), true);
  assert.equal(hasPermission('product_manager', 'product.releases.approve'), false);
  assert.equal(hasPermission('product_owner', 'product.requirements.approve'), true);
  assert.equal(hasPermission('roadmap_planner', 'product.roadmap.write'), true);
  assert.equal(hasPermission('release_manager', 'product.releases.approve'), true);
  assert.equal(hasPermission('bom_manager', 'product.bom.approve'), true);
  assert.equal(hasPermission('auditor', 'product.audit.read'), true);
  assert.equal(hasPermission('product_admin', 'product.components.write'), true);
});
