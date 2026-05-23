const assert = require('node:assert/strict');
const test = require('node:test');
const { unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { DataStore, EventBus, hasPermission } = require('../dist/core.js');
const { SecurityService } = require('../dist/security.service.js');
const { createSeedState } = require('../dist/seed-state.js');

function makeService() {
  const file = join(process.cwd(), 'data', `securityos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState('test-tenant'));
  const service = new SecurityService(store, new EventBus(store));
  const actor = { tenantId: 'test-tenant', userId: 'tester', role: 'security_admin' };
  return { service, actor, file };
}
function cleanup(file) { try { unlinkSync(file); } catch {} }

test('SecurityOS seed overview returns security analytics', () => {
  const { service, actor, file } = makeService();
  const overview = service.overview(actor);
  assert.equal(overview.counts.identities, 4);
  assert.equal(overview.counts.roles, 5);
  assert.equal(overview.analytics.activeIdentities, 4);
  assert.equal(overview.analytics.expiredSessions, 1);
  assert.equal(overview.analytics.findings.open, 2);
  cleanup(file);
});

test('SecurityOS checks RBAC and deny policies', () => {
  const { service, actor, file } = makeService();
  const allowed = service.checkAccess(actor, { subjectId: 'ident_demo_rahul', action: 'commerce.orders.write', resource: 'commerce.orders' });
  assert.equal(allowed.allowed, true);
  assert.ok(allowed.roles.includes('Commerce Operator'));
  const denied = service.checkAccess(actor, { subjectId: 'ident_demo_rahul', action: 'security.secrets.reveal', resource: 'security.secrets' });
  assert.equal(denied.allowed, false);
  assert.ok(denied.reasons.some((reason) => reason.startsWith('policy.deny')));
  cleanup(file);
});

test('SecurityOS creates identity, role, assignment and grants access', () => {
  const { service, actor, file } = makeService();
  const identity = service.createIdentity(actor, { email: 'dev@example.com', displayName: 'Dev User', mfaEnabled: true });
  const role = service.createRole(actor, { name: 'Website Publisher', permissions: ['website.pages.*'] });
  service.createAssignment(actor, { subjectType: 'identity', subjectId: identity.id, roleId: role.id });
  const decision = service.checkAccess(actor, { subjectId: identity.id, action: 'website.pages.publish', resource: 'website.pages' });
  assert.equal(decision.allowed, true);
  assert.ok(decision.permissions.includes('website.pages.*'));
  cleanup(file);
});

test('SecurityOS manages secrets with masking, reveal and rotation', () => {
  const { service, actor, file } = makeService();
  const secret = service.createSecret(actor, { name: 'OPENAI_API_KEY', environment: 'prod', value: 'sk-demo-secret-value', tags: ['aios'] });
  assert.equal(secret.name, 'OPENAI_API_KEY');
  assert.equal(Object.prototype.hasOwnProperty.call(secret, 'encryptedValue'), false);
  assert.ok(secret.maskedValue.includes('****'));
  const revealed = service.revealSecret(actor, secret.id);
  assert.equal(revealed.value, 'sk-demo-secret-value');
  const rotated = service.rotateSecret(actor, secret.id, { value: 'sk-demo-rotated-value' });
  assert.equal(rotated.version, 2);
  const versions = service.secretVersions(actor, secret.id);
  assert.equal(versions.length, 2);
  cleanup(file);
});

test('SecurityOS creates and verifies API keys without returning stored hash in lists', () => {
  const { service, actor, file } = makeService();
  const result = service.createApiKey(actor, { ownerId: 'ident_demo_service_commerce', name: 'Integration Key', scopes: ['devos.webhooks.write'] });
  assert.ok(result.secretToken);
  const verified = service.verifyApiKey(actor, result.secretToken);
  assert.equal(verified.valid, true);
  const listed = service.listApiKeys(actor).find((key) => key.id === result.id);
  assert.equal(Object.prototype.hasOwnProperty.call(listed, 'keyHash'), false);
  cleanup(file);
});

test('SecurityOS links compliance evidence and updates control status', () => {
  const { service, actor, file } = makeService();
  const evidence = service.createEvidence(actor, { controlId: 'ctrl_soc2_cc6_1', title: 'Access review export', evidenceType: 'document', uri: 'appneural://evidence/access-review' });
  assert.equal(evidence.controlId, 'ctrl_soc2_cc6_1');
  const control = service.updateControlStatus(actor, 'ctrl_soc2_cc6_1', { status: 'compliant' });
  assert.equal(control.status, 'compliant');
  assert.ok(control.evidenceIds.includes(evidence.id));
  cleanup(file);
});

test('SecurityOS access reviews can revoke assignments', () => {
  const { service, actor, file } = makeService();
  const review = service.decideAccessReviewItem(actor, 'review_q2_access', { identityId: 'ident_demo_asha', roleId: 'role_security_auditor', status: 'revoked', notes: 'No longer required' });
  const item = review.items.find((entry) => entry.identityId === 'ident_demo_asha');
  assert.equal(item.status, 'revoked');
  const assignment = service.listAssignments(actor).find((entry) => entry.id === 'assign_asha_auditor');
  assert.equal(assignment.status, 'revoked');
  cleanup(file);
});

test('SecurityOS permissions protect API roles', () => {
  assert.equal(hasPermission('viewer', 'security.identities.write'), false);
  assert.equal(hasPermission('iam_admin', 'security.identities.write'), true);
  assert.equal(hasPermission('secret_manager', 'security.secrets.reveal'), true);
  assert.equal(hasPermission('compliance_manager', 'security.controls.write'), true);
  assert.equal(hasPermission('auditor', 'security.audit.read'), true);
  assert.equal(hasPermission('security_admin', 'security.secrets.write'), true);
});
