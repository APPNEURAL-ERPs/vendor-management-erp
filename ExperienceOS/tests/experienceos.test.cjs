const assert = require('node:assert/strict');
const test = require('node:test');
const { unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { DataStore } = require('../dist/core/datastore.js');
const { EventBus } = require('../dist/core/event-bus.js');
const { ExperienceService } = require('../dist/services/experience.service.js');
const { createSeedState } = require('../dist/seed-state.js');
const { hasPermission } = require('../dist/core/security.js');

function makeService() {
  const file = join(process.cwd(), 'data', `experienceos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState('test-tenant'));
  const service = new ExperienceService(store, new EventBus(store));
  const actor = { tenantId: 'test-tenant', userId: 'tester', role: 'experience_admin' };
  return { service, actor, file };
}
function cleanup(file) { try { unlinkSync(file); } catch {} }

test('ExperienceOS seed overview returns CX analytics', () => {
  const { service, actor, file } = makeService();
  const overview = service.overview(actor);
  assert.equal(overview.analytics.totalProfiles, 3);
  assert.equal(overview.analytics.totalFeedback, 3);
  assert.equal(overview.analytics.surveys, 2);
  assert.equal(overview.analytics.journeyMaps, 1);
  assert.ok(overview.analytics.nps.responses >= 2);
  cleanup(file);
});

test('ExperienceOS captures feedback, opens case, creates recovery action, and resolves case', () => {
  const { service, actor, file } = makeService();
  const feedback = service.createFeedback(actor, { profileId: 'prof_demo_rahul', channel: 'chat', type: 'complaint', rating: 1, message: 'Worst support, delivery failed and I am angry.', tags: ['delivery'] });
  assert.equal(feedback.sentimentLabel, 'negative');
  assert.equal(feedback.priority, 'urgent');
  const triaged = service.triageFeedback(actor, feedback.id, { priority: 'urgent', tags: ['delivery', 'urgent'] });
  assert.equal(triaged.status, 'triaged');
  const item = service.createCase(actor, { profileId: 'prof_demo_rahul', subject: 'Urgent recovery', description: 'Customer needs recovery.', type: 'experience_recovery', priority: 'urgent', feedbackIds: [feedback.id] });
  assert.equal(item.priority, 'urgent');
  assert.ok(item.responseDueAt);
  const assigned = service.assignCase(actor, item.id, { assignedTo: 'agent_002' });
  assert.equal(assigned.status, 'in_progress');
  const action = service.createRecoveryAction(actor, { caseId: item.id, type: 'send_coupon', title: 'Send apology coupon' });
  assert.equal(action.status, 'planned');
  const completed = service.completeRecoveryAction(actor, action.id, { result: 'Coupon sent' });
  assert.equal(completed.status, 'completed');
  const resolved = service.resolveCase(actor, item.id, { resolutionSummary: 'Coupon and apology sent.', close: true });
  assert.equal(resolved.status, 'closed');
  cleanup(file);
});

test('ExperienceOS manages surveys, responses, journeys, touchpoints, and analytics', () => {
  const { service, actor, file } = makeService();
  const survey = service.createSurvey(actor, { title: 'Clinic CES', type: 'ces', channel: 'mobile', questions: [{ label: 'How easy was booking?', type: 'rating', scaleMin: 1, scaleMax: 7 }] });
  const live = service.publishSurvey(actor, survey.id);
  assert.equal(live.status, 'live');
  const response = service.submitSurveyResponse(actor, survey.id, { profileId: 'prof_demo_nisha', cesScore: 6, answers: { ces: 6, comment: 'Booking was helpful and smooth.' } });
  assert.equal(response.sentimentLabel, 'positive');
  const journey = service.createJourneyMap(actor, { name: 'Clinic Appointment Journey', persona: 'Patient', status: 'active', stages: [{ name: 'Book', order: 1 }, { name: 'Visit', order: 2 }] });
  assert.equal(journey.stages.length, 2);
  const touchpoint = service.createTouchpoint(actor, { name: 'Appointment Booking', channel: 'mobile', journeyMapId: journey.id, stageId: journey.stages[0].id });
  const event = service.recordJourneyEvent(actor, { profileId: 'prof_demo_nisha', journeyMapId: journey.id, stageId: journey.stages[0].id, touchpointId: touchpoint.id, eventType: 'appointment.booked', outcome: 'success', score: 8 });
  assert.equal(event.outcome, 'success');
  const analytics = service.analytics(actor);
  assert.ok(analytics.surveyResponses >= 4);
  assert.ok(analytics.touchpoints >= 4);
  cleanup(file);
});

test('ExperienceOS permissions protect write and audit operations by role', () => {
  assert.equal(hasPermission('viewer', 'experience.feedback.write'), false);
  assert.equal(hasPermission('experience_agent', 'experience.feedback.write'), true);
  assert.equal(hasPermission('support_agent', 'experience.cases.write'), true);
  assert.equal(hasPermission('researcher', 'experience.surveys.write'), true);
  assert.equal(hasPermission('auditor', 'experience.audit.read'), true);
  assert.equal(hasPermission('experience_admin', 'experience.sla.write'), true);
});
