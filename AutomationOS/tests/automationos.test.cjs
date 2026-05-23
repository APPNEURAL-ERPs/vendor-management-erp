const test = require('node:test');
const assert = require('node:assert/strict');
const { unlinkSync } = require('node:fs');

const { DataStore } = require('../dist/core/datastore.js');
const { AutomationService } = require('../dist/services/automation.service.js');
const { createSeedState } = require('../dist/seed-state.js');

function actor(role = 'automation_manager', userId = `${role}-user`) {
  return { tenantId: 'demo-tenant', userId, role };
}

function freshService(name) {
  const file = `data/test-${name}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  const store = new DataStore(file);
  store.reset(createSeedState('demo-tenant'));
  return { store, service: new AutomationService(store), file };
}

test('AutomationOS starts with seeded workflows and overview', () => {
  const { service } = freshService('overview');
  const overview = service.overview(actor('viewer'));
  assert.equal(overview.workflows.active, 4);
  assert.equal(overview.tasks.open, 1);
});

test('CommerceOS high-value order event creates waiting approval execution', () => {
  const { service } = freshService('approval');
  const result = service.ingestEvent({
    type: 'order.created',
    source: 'CommerceOS',
    data: { orderId: 'ORD-T1', customerId: 'CUS-T1', totalAmount: 7500 }
  }, actor('operator'));

  assert.equal(result.matchedWorkflows, 1);
  assert.equal(result.executions.length, 1);
  assert.equal(result.executions[0].status, 'waiting_approval');

  const approvals = service.listApprovals(actor('approver'), undefined).filter((approval) => approval.status === 'pending');
  assert.equal(approvals.length, 1);
  assert.match(approvals[0].title, /ORD-T1/);
});

test('Approval resumes workflow and creates task, notification, and event', () => {
  const { service } = freshService('approve-resume');
  service.ingestEvent({
    type: 'order.created',
    source: 'CommerceOS',
    data: { orderId: 'ORD-T2', customerId: 'CUS-T2', totalAmount: 8000 }
  }, actor('operator'));

  const pending = service.listApprovals(actor('approver'), undefined).find((approval) => approval.status === 'pending');
  assert.ok(pending);
  const execution = service.decideApproval(pending.id, { decision: 'approved', note: 'test approved' }, actor('approver', 'manager-001'));

  assert.equal(execution.status, 'completed');
  assert.ok(execution.taskIds.length >= 1);
  assert.ok(service.listTasks(actor('viewer'), undefined).some((task) => task.title.includes('ORD-T2')));
  assert.ok(service.listNotifications(actor('viewer')).some((notification) => notification.message.includes('ORD-T2')));
  assert.ok(service.listEvents(actor('viewer')).some((event) => event.type === 'order.approved'));
});

test('Lead event runs without approval and creates follow-up task', () => {
  const { service } = freshService('lead');
  const result = service.ingestEvent({
    type: 'lead.created',
    source: 'GrowthOS',
    data: { leadId: 'LEAD-T1', name: 'Asha', email: 'asha@example.com' }
  }, actor('operator'));

  assert.equal(result.matchedWorkflows, 1);
  assert.equal(result.executions[0].status, 'completed');
  assert.ok(service.listTasks(actor('viewer'), undefined).some((task) => task.title.includes('Asha')));
});

test('Webhook automation creates urgent support task', () => {
  const { service } = freshService('webhook');
  const result = service.handleWebhook('support-escalation', {
    source: 'ClientOS',
    data: { ticketId: 'TICKET-T1', severity: 'critical' }
  }, actor('operator'));

  assert.equal(result.matchedWorkflows, 1);
  assert.equal(result.executions[0].status, 'completed');
  assert.ok(service.listTasks(actor('viewer'), undefined).some((task) => task.title.includes('TICKET-T1')));
});

test('Due schedule runner executes schedule workflow', () => {
  const { service } = freshService('schedule');
  const result = service.runDueSchedules(actor('operator'));
  assert.equal(result.executions.length, 1);
  assert.equal(result.executions[0].status, 'completed');
  assert.ok(service.listEvents(actor('viewer')).some((event) => event.type === 'ops.digest.generated'));
});
