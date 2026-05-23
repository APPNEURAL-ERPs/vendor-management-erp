const assert = require('node:assert/strict');
const test = require('node:test');
const { unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { DataStore } = require('../dist/core/datastore.js');
const { EventBus } = require('../dist/core/event-bus.js');
const { GrowthService } = require('../dist/services/growth.service.js');
const { createSeedState } = require('../dist/seed-state.js');
const { hasPermission } = require('../dist/core/security.js');

function makeService() {
  const file = join(process.cwd(), 'data', `growthos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState('test-tenant'));
  const service = new GrowthService(store, new EventBus(store));
  const actor = { tenantId: 'test-tenant', userId: 'tester', role: 'growth_admin' };
  return { service, actor, file };
}
function cleanup(file) { try { unlinkSync(file); } catch {} }

test('GrowthOS seed overview returns growth analytics', () => {
  const { service, actor, file } = makeService();
  const overview = service.overview(actor);
  assert.equal(overview.analytics.totalLeads, 3);
  assert.equal(overview.analytics.activeCampaigns, 1);
  assert.equal(overview.analytics.totalConversions, 2);
  assert.ok(overview.analytics.revenue >= 75000);
  cleanup(file);
});

test('GrowthOS creates and scores leads using touchpoints and conversions', () => {
  const { service, actor, file } = makeService();
  const lead = service.createLead(actor, { firstName: 'Maya', email: 'maya@example.com', phone: '+91-90000-10000', company: 'CloudlyUp', jobTitle: 'CTO', source: 'ads', tags: ['saas'], consent: 'opted_in' });
  assert.equal(lead.status, 'new');
  service.captureTouchpoint(actor, { leadId: lead.id, eventType: 'email_click', channel: 'email', source: 'Launch Email' });
  service.captureTouchpoint(actor, { leadId: lead.id, eventType: 'demo_request', channel: 'content', source: 'Demo Page' });
  service.createConversion(actor, { leadId: lead.id, type: 'mql', amount: 0 });
  const scored = service.recalculateLeadScore(actor, lead.id);
  assert.ok(scored.lead.score >= 65);
  const qualified = service.qualifyLead(actor, lead.id);
  assert.equal(qualified.status, 'qualified');
  cleanup(file);
});

test('GrowthOS manages campaigns, touchpoints, conversions, and campaign analytics', () => {
  const { service, actor, file } = makeService();
  const campaign = service.createCampaign(actor, { name: 'Growth Sprint', channel: 'ads', budget: 10000, metrics: { cost: 5000 } });
  service.launchCampaign(actor, campaign.id);
  const lead = service.createLead(actor, { firstName: 'Karan', email: 'karan@example.com', source: 'ads' });
  service.captureTouchpoint(actor, { leadId: lead.id, campaignId: campaign.id, eventType: 'visit', channel: 'ads', source: 'Growth Sprint' });
  service.captureTouchpoint(actor, { leadId: lead.id, campaignId: campaign.id, eventType: 'ad_click', channel: 'ads', source: 'Growth Sprint' });
  service.captureTouchpoint(actor, { leadId: lead.id, campaignId: campaign.id, eventType: 'form_submit', channel: 'ads', source: 'Growth Sprint' });
  service.createConversion(actor, { leadId: lead.id, campaignId: campaign.id, type: 'revenue', amount: 25000, source: 'Growth Sprint' });
  const analytics = service.analytics(actor);
  const perf = analytics.campaignPerformance.find((item) => item.id === campaign.id);
  assert.equal(perf.impressions, 1);
  assert.equal(perf.clicks, 1);
  assert.equal(perf.leads, 1);
  assert.equal(perf.conversions, 1);
  assert.equal(perf.revenue, 25000);
  assert.ok(perf.roi > 0);
  cleanup(file);
});

test('GrowthOS evaluates segments and moves leads through funnels', () => {
  const { service, actor, file } = makeService();
  const lead = service.createLead(actor, { email: 'retail@example.com', company: 'RetailCo', source: 'linkedin', customFields: { industry: 'retail' }, tags: ['retail'], consent: 'opted_in' });
  service.captureTouchpoint(actor, { leadId: lead.id, eventType: 'demo_request', source: 'Demo Page' });
  service.recalculateLeadScore(actor, lead.id);
  const segment = service.createSegment(actor, { name: 'Retail Demo', rules: [{ field: 'custom.industry', operator: 'eq', value: 'retail' }, { field: 'score', operator: 'gte', value: 35 }] });
  const evaluated = service.evaluateSegment(actor, segment.id);
  assert.ok(evaluated.leadIds.includes(lead.id));
  const funnel = service.createFunnel(actor, { name: 'Partner Funnel' });
  const membership = service.enrollLeadInFunnel(actor, funnel.id, { leadId: lead.id });
  const moved = service.moveFunnelMembership(actor, membership.id, { stageOrder: 3 });
  assert.equal(moved.stageId, funnel.stages[2].id);
  const closed = service.closeFunnelMembership(actor, membership.id, { status: 'converted' });
  assert.equal(closed.status, 'converted');
  cleanup(file);
});

test('GrowthOS handles landing pages, experiments, and nurture sequences', () => {
  const { service, actor, file } = makeService();
  const page = service.createLandingPage(actor, { name: 'PromptlyUp Demo', headline: 'Launch prompt operations' });
  service.publishLandingPage(actor, page.id);
  service.captureTouchpoint(actor, { landingPageId: page.id, eventType: 'visit', source: page.slug, channel: 'content' });
  const submission = service.submitLandingPage(actor, page.id, { firstName: 'Nisha', email: 'nisha@example.com', company: 'MediaUp' });
  assert.ok(submission.lead.id);
  const refreshedPage = service.listLandingPages(actor).find((item) => item.id === page.id);
  assert.equal(refreshedPage.metrics.visits, 1);
  assert.equal(refreshedPage.metrics.submissions, 1);

  const experiment = service.createExperiment(actor, { name: 'CTA Test', variants: [{ name: 'Control' }, { name: 'Book Demo' }] });
  service.startExperiment(actor, experiment.id);
  service.recordExperimentEvent(actor, experiment.id, { variantName: 'Book Demo', event: 'visitor', count: 100 });
  service.recordExperimentEvent(actor, experiment.id, { variantName: 'Book Demo', event: 'conversion', count: 18, revenue: 9000 });
  const analysis = service.analyzeExperiment(actor, experiment.id);
  assert.equal(analysis.suggestedWinnerName, 'Book Demo');

  const sequence = service.createNurtureSequence(actor, { name: 'Demo Follow-up' });
  const enrollment = service.enrollLeadInNurture(actor, sequence.id, { leadId: submission.lead.id });
  const advanced = service.advanceNurtureEnrollment(actor, enrollment.id);
  assert.equal(advanced.currentStepOrder, 2);
  cleanup(file);
});

test('GrowthOS permissions protect growth operations by role', () => {
  assert.equal(hasPermission('viewer', 'growth.leads.write'), false);
  assert.equal(hasPermission('growth_rep', 'growth.leads.write'), true);
  assert.equal(hasPermission('marketer', 'growth.campaigns.write'), true);
  assert.equal(hasPermission('campaign_manager', 'growth.experiments.write'), true);
  assert.equal(hasPermission('growth_manager', 'growth.audit.read'), true);
  assert.equal(hasPermission('auditor', 'growth.audit.read'), true);
  assert.equal(hasPermission('growth_admin', 'growth.nurture.write'), true);
});
