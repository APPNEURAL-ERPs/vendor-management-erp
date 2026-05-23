const assert = require('node:assert/strict');
const test = require('node:test');
const { unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { DataStore } = require('../dist/core/datastore.js');
const { EventBus } = require('../dist/core/event-bus.js');
const { DevService } = require('../dist/services/dev.service.js');
const { createSeedState } = require('../dist/seed-state.js');
const { hasPermission } = require('../dist/core/security.js');

function makeService() {
  const file = join(process.cwd(), 'data', `developeros-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState('test-tenant'));
  const service = new DevService(store, new EventBus(store));
  const actor = { tenantId: 'test-tenant', userId: 'tester', role: 'dev_admin' };
  return { service, actor, file };
}
function cleanup(file) { try { unlinkSync(file); } catch {} }

test('DeveloperOS seed overview returns developer analytics', () => {
  const { service, actor, file } = makeService();
  const overview = service.overview(actor);
  assert.equal(overview.analytics.totalApps, 2);
  assert.equal(overview.analytics.apiProducts, 2);
  assert.equal(overview.analytics.endpoints, 3);
  assert.equal(overview.analytics.totalApiCalls, 3);
  assert.ok(overview.publishedDocs.length >= 1);
  cleanup(file);
});

test('DeveloperOS creates API product, endpoint, developer app, API key, webhook, and SDK version', () => {
  const { service, actor, file } = makeService();
  const api = service.createApiProduct(actor, {
    name: 'CommerceOS Partner API',
    description: 'Partner API for CommerceOS order integrations.',
    slug: 'commerceos-partner-api',
    visibility: 'partner',
    status: 'active',
    ownerTeam: 'CommerceOS'
  });
  assert.equal(api.slug, 'commerceos-partner-api');
  const endpoint = service.createEndpoint(actor, api.id, { method: 'GET', path: '/orders', summary: 'List orders', scopesRequired: ['orders.read'], rateLimitPerMinute: 120, status: 'active' });
  assert.equal(endpoint.method, 'GET');
  const app = service.createApp(actor, {
    name: 'Commerce Partner App',
    ownerUserId: 'dev_001',
    environmentIds: ['env_prod'],
    callbackUrls: ['https://partner.example/callback'],
    allowedOrigins: ['https://partner.example'],
    scopes: ['orders.read']
  });
  assert.equal(app.ownerUserId, 'dev_001');
  const key = service.createApiKey(actor, app.id, { name: 'Live key', environmentId: 'env_prod' });
  assert.ok(key.plainTextKey);
  assert.ok(key.maskedKey.includes('...'));
  assert.notEqual(key.maskedKey, key.plainTextKey);
  const sdk = service.createSdkPackage(actor, { name: 'CommerceOS TypeScript SDK', language: 'typescript', apiProductIds: [api.id] });
  const version = service.generateSdkVersion(actor, sdk.id, { version: '1.0.0' });
  assert.equal(version.status, 'generated');
  assert.match(version.artifactPath, /typescript/);
  const webhook = service.createWebhookSubscription(actor, { appId: app.id, name: 'Order webhook', targetUrl: 'https://partner.example/webhook', eventTypes: ['order.created'], secret: 'secret' });
  const delivery = service.testWebhook(actor, { subscriptionId: webhook.id, eventType: 'order.created', payload: { orderId: 'ORD-1' } });
  assert.equal(delivery.status, 'sent');
  cleanup(file);
});

test('DeveloperOS runs pipeline, approvals, deployments, docs, changelog, and usage analytics', () => {
  const { service, actor, file } = makeService();
  const env = service.createEnvironment(actor, { name: 'Sandbox', slug: 'sandbox', type: 'sandbox', variables: { TOKEN: 'secret-token' } });
  assert.ok(env.variables.TOKEN.includes('...'));
  assert.notEqual(env.variables.TOKEN, 'secret-token');
  const pipeline = service.createPipeline(actor, { name: 'Sandbox API CI', repository: 'github.com/appneural/sandbox-api', environmentId: env.id });
  const run = service.runPipeline(actor, pipeline.id, { commitSha: 'abc123' });
  assert.equal(run.status, 'running');
  let current = service.completePipelineStage(actor, run.id, { success: true, log: 'Build ok' });
  current = service.completePipelineStage(actor, run.id, { success: true, log: 'Tests ok' });
  assert.equal(current.status, 'waiting_approval');
  current = service.approvePipelineRun(actor, run.id, { approved: true, comment: 'Approved for deploy' });
  assert.equal(current.status, 'running');
  current = service.completePipelineStage(actor, run.id, { success: true, log: 'Deploy ok' });
  assert.equal(current.status, 'passed');
  const deployment = service.createDeployment(actor, { environmentId: env.id, pipelineRunId: run.id, version: '2.0.0', url: 'https://sandbox.example' });
  assert.equal(deployment.status, 'deployed');
  const rollback = service.rollbackDeployment(actor, deployment.id);
  assert.equal(rollback.status, 'rolled_back');
  const page = service.createDocsPage(actor, { title: 'Sandbox Guide', body: 'Use the sandbox safely.' });
  const published = service.publishDocsPage(actor, page.id);
  assert.equal(published.status, 'published');
  const changelog = service.createChangelogEntry(actor, { title: 'Sandbox release', version: '2.0.0', body: 'New sandbox API.' });
  assert.equal(changelog.status, 'published');
  service.ingestUsageEvent(actor, { appId: 'app_demo_partner', apiKeyId: 'key_demo_partner_prod', apiProductId: 'api_demo_commerce', endpointId: 'ep_demo_orders_list', method: 'GET', path: '/orders', statusCode: 200, latencyMs: 77 });
  const analytics = service.analytics(actor);
  assert.ok(analytics.totalApiCalls >= 4);
  cleanup(file);
});

test('DeveloperOS permissions protect sensitive operations by role', () => {
  assert.equal(hasPermission('viewer', 'dev.keys.write'), false);
  assert.equal(hasPermission('developer', 'dev.keys.write'), true);
  assert.equal(hasPermission('release_manager', 'dev.pipelines.write'), true);
  assert.equal(hasPermission('security_reviewer', 'dev.audit.read'), true);
  assert.equal(hasPermission('dev_admin', 'dev.deployments.write'), true);
});
