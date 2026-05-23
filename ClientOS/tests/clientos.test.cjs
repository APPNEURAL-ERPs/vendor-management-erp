const assert = require('node:assert/strict');
const test = require('node:test');
const { unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { DataStore } = require('../dist/core/datastore.js');
const { EventBus } = require('../dist/core/event-bus.js');
const { ClientService } = require('../dist/services/client.service.js');
const { createSeedState } = require('../dist/seed-state.js');
const { hasPermission } = require('../dist/core/security.js');

function makeService() {
  const file = join(process.cwd(), 'data', `clientos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState('test-tenant'));
  const service = new ClientService(store, new EventBus(store));
  const actor = { tenantId: 'test-tenant', userId: 'tester', role: 'client_admin' };
  return { service, actor, file };
}

function cleanup(file) { try { unlinkSync(file); } catch {} }

test('ClientOS seed overview returns analytics', () => {
  const { service, actor, file } = makeService();
  const overview = service.overview(actor);
  assert.equal(overview.analytics.totalAccounts, 3);
  assert.equal(overview.analytics.totalContacts, 3);
  assert.ok(overview.analytics.openTickets >= 1);
  cleanup(file);
});

test('ClientOS creates account, contact, ticket, response and resolution', () => {
  const { service, actor, file } = makeService();
  const account = service.createAccount(actor, { name: 'Apex Services', status: 'active', lifecycleStage: 'onboarding', tags: ['services'] });
  const contact = service.createContact(actor, { accountId: account.id, firstName: 'Priya', lastName: 'Kapoor', email: 'PRIYA@APEX.EXAMPLE', decisionMaker: true });
  assert.equal(contact.email, 'priya@apex.example');
  const ticket = service.createTicket(actor, { accountId: account.id, contactId: contact.id, subject: 'Setup help', description: 'Need onboarding support', priority: 'high', channel: 'portal' });
  assert.equal(ticket.priority, 'high');
  assert.ok(ticket.firstResponseDueAt);
  const response = service.respondToTicket(actor, ticket.id, { message: 'We are helping you now.' });
  assert.ok(response.ticket.firstResponseAt);
  const resolved = service.resolveTicket(actor, ticket.id, { resolutionSummary: 'Onboarding completed', satisfactionScore: 5 });
  assert.equal(resolved.status, 'resolved');
  assert.equal(resolved.satisfactionScore, 5);
  cleanup(file);
});

test('ClientOS manages opportunity pipeline and segment evaluation', () => {
  const { service, actor, file } = makeService();
  const account = service.createAccount(actor, { name: 'Risky Client', status: 'at_risk', lifecycleStage: 'retention', healthScore: 35, tags: ['at-risk'] });
  const opportunity = service.createOpportunity(actor, { accountId: account.id, name: 'Retention expansion', value: 100000, stage: 'proposal' });
  const won = service.changeOpportunityStage(actor, opportunity.id, { stage: 'won' });
  assert.equal(won.status, 'won');
  const segment = service.createSegment(actor, { name: 'Low health', filters: { healthScoreBelow: 60 }, dynamic: true });
  assert.ok(segment.accountIds.includes(account.id));
  const overview = service.overview(actor);
  assert.ok(overview.analytics.wonRevenue >= 100000);
  cleanup(file);
});

test('ClientOS permissions protect write operations by role', () => {
  assert.equal(hasPermission('viewer', 'client.accounts.write'), false);
  assert.equal(hasPermission('support_agent', 'client.tickets.write'), true);
  assert.equal(hasPermission('client_admin', 'client.sla.write'), true);
});
