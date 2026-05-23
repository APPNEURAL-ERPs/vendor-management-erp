const test = require('node:test');
const assert = require('node:assert/strict');

const { DataStore } = require('../dist/core/datastore.js');
const { EventBus } = require('../dist/core/event-bus.js');
const { BrandService } = require('../dist/services/brand.service.js');
const { createSeedState } = require('../dist/seed-state.js');

function actor(role = 'brand_manager', userId = `${role}-user`) {
  return { tenantId: 'demo-tenant', userId, role };
}

function freshService(name) {
  const file = `data/test-brandos-${name}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  const store = new DataStore(file);
  store.reset(createSeedState('demo-tenant'));
  const events = new EventBus(store);
  return { store, service: new BrandService(store, events), file };
}

test('BrandOS starts with seeded brand kit, assets, campaign, and approval', () => {
  const { service } = freshService('overview');
  const overview = service.overview(actor('viewer'));
  assert.equal(overview.counts.brandKits, 1);
  assert.equal(overview.counts.assets, 3);
  assert.equal(overview.counts.approvedAssets, 2);
  assert.equal(overview.counts.activeCampaigns, 1);
  assert.equal(overview.counts.pendingApprovals, 1);
});

test('Designer creates asset, submits it, and approver approves it', () => {
  const { service } = freshService('asset-approval');
  const asset = service.createAsset(actor('designer'), {
    brandKitId: 'kit_appneural_master',
    name: 'New Appneural banner',
    type: 'image',
    url: 'https://assets.example/new-banner.png',
    tags: ['banner', 'launch']
  });
  assert.equal(asset.status, 'draft');

  const approval = service.submitAsset(actor('designer'), asset.id);
  assert.equal(approval.status, 'pending');
  assert.equal(service.getAsset(actor('viewer'), asset.id).status, 'in_review');

  const decided = service.decideApproval(actor('approver', 'approver-001'), approval.id, { decision: 'approved', note: 'Looks good' });
  assert.equal(decided.status, 'approved');
  const approved = service.getAsset(actor('viewer'), asset.id);
  assert.equal(approved.status, 'approved');
  assert.equal(approved.approvedBy, 'approver-001');
});

test('Compliance engine catches banned claims and missing hashtag', () => {
  const { service } = freshService('compliance');
  const result = service.checkCompliance(actor('content_creator'), {
    brandKitId: 'kit_appneural_master',
    title: 'Appneural launch',
    body: 'This product guarantees guaranteed success for every company.',
    tags: ['launch']
  });
  assert.equal(result.passed, false);
  assert.ok(result.score < 70);
  assert.ok(result.violations.some((violation) => violation.ruleName === 'Avoid guaranteed claims'));
  assert.ok(result.violations.some((violation) => violation.ruleName === 'Use Appneural hashtag'));
});

test('Content can be created, submitted, approved, scheduled, and published', () => {
  const { service } = freshService('content-flow');
  const content = service.createContent(actor('content_creator'), {
    brandKitId: 'kit_appneural_master',
    title: 'Appneural platform update',
    type: 'social_post',
    channel: 'linkedin',
    body: 'Appneural helps teams reuse brand, AI, analytics, and automation systems across platforms. #Appneural',
    assetIds: ['asset_logo_primary'],
    tags: ['update']
  });
  assert.equal(content.compliancePassed, true);

  const approval = service.submitContent(actor('content_creator'), content.id);
  assert.equal(approval.status, 'pending');
  service.decideApproval(actor('approver'), approval.id, { decision: 'approved' });
  assert.equal(service.getContent(actor('viewer'), content.id).status, 'approved');

  const job = service.scheduleContent(actor('marketer'), content.id, { scheduledAt: '2026-05-20T10:00:00.000Z' });
  assert.equal(job.status, 'queued');
  assert.equal(service.getContent(actor('viewer'), content.id).status, 'scheduled');

  const published = service.publishContent(actor('marketer'), content.id, { result: { provider: 'manual-test' } });
  assert.equal(published.status, 'published');
  assert.equal(service.getContent(actor('viewer'), content.id).status, 'published');
});

test('Campaign can attach assets and content and produce a rollup', () => {
  const { service } = freshService('campaign-rollup');
  const campaign = service.createCampaign(actor('marketer'), {
    brandKitId: 'kit_appneural_master',
    name: 'Website refresh',
    objective: 'Refresh public website brand presence.',
    channels: ['website', 'linkedin'],
    budget: 100000,
    tags: ['website']
  });
  const content = service.createContent(actor('content_creator'), {
    brandKitId: 'kit_appneural_master',
    title: 'Website refresh announcement',
    type: 'blog',
    channel: 'website',
    body: 'Appneural refreshed its website to explain reusable OS layers more clearly. #Appneural',
    assetIds: ['asset_logo_primary'],
    tags: ['website']
  });
  service.attachContentToCampaign(actor('marketer'), campaign.id, content.id);
  service.attachAssetToCampaign(actor('marketer'), campaign.id, 'asset_logo_primary');
  const rollup = service.campaignRollup(actor('viewer'), campaign.id);
  assert.equal(rollup.contentCount, 1);
  assert.equal(rollup.approvedAssets, 1);
  assert.ok(rollup.channels.includes('website'));
});

test('Asset search filters by tag and type', () => {
  const { service } = freshService('search');
  const params = new URLSearchParams({ tag: 'approved', type: 'logo' });
  const assets = service.listAssets(actor('viewer'), params);
  assert.equal(assets.length, 1);
  assert.equal(assets[0].id, 'asset_logo_primary');
});
