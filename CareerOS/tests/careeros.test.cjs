const test = require('node:test');
const assert = require('node:assert/strict');

const { DataStore } = require('../dist/core/datastore.js');
const { EventBus } = require('../dist/core/event-bus.js');
const { CareerService } = require('../dist/services/career.service.js');
const { createSeedState } = require('../dist/seed-state.js');
const { Router } = require('../dist/core/http.js');
const { registerRoutes } = require('../dist/modules/routes.js');
const { hasPermission } = require('../dist/core/security.js');

function actor(role = 'career_admin', userId = `${role}-user`) {
  return { tenantId: 'demo-tenant', userId, role };
}

function freshService(name) {
  const file = `data/test-careeros-${name}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  const store = new DataStore(file);
  store.reset(createSeedState('demo-tenant'));
  const events = new EventBus(store);
  return { store, service: new CareerService(store, events), file };
}

test('CareerOS starts with seeded jobs, candidates, applications, interviews, offers, and pools', () => {
  const { service } = freshService('overview');
  const overview = service.overview(actor('viewer'));

  assert.equal(overview.counts.jobs, 2);
  assert.equal(overview.counts.openJobs, 2);
  assert.equal(overview.counts.candidates, 3);
  assert.equal(overview.counts.applications, 3);
  assert.equal(overview.counts.activeApplications, 3);
  assert.equal(overview.counts.interviewsScheduled, 0);
  assert.equal(overview.counts.offersOpen, 1);
  assert.equal(overview.counts.talentPools, 1);
});

test('Recruiter creates, updates, publishes, pauses, and closes a job with default pipeline stages', () => {
  const { service } = freshService('jobs');
  const job = service.createJob(actor('recruiter'), {
    code: 'QA-001',
    title: 'QA Automation Engineer',
    department: 'Engineering',
    location: 'Remote',
    requiredSkills: ['typescript', 'playwright', 'testing'],
    niceToHaveSkills: ['ci/cd'],
    experienceMinYears: 2,
    description: 'Own automated testing for Appneural OS packages.'
  });

  assert.equal(job.status, 'draft');
  assert.equal(job.code, 'QA-001');
  assert.equal(service.listPipelineStages(actor('recruiter'), job.id).length, 7);

  const updated = service.updateJob(actor('recruiter'), job.id, { openings: 2, priority: 'high' });
  assert.equal(updated.openings, 2);
  assert.equal(updated.priority, 'high');

  const published = service.publishJob(actor('recruiter'), job.id);
  assert.equal(published.status, 'open');
  assert.ok(published.publishedAt);

  assert.equal(service.pauseJob(actor('recruiter'), job.id).status, 'paused');
  assert.equal(service.closeJob(actor('recruiter'), job.id).status, 'closed');
});

test('Candidate profile, resume, and matching engine work', () => {
  const { service } = freshService('candidate-match');
  const candidate = service.createCandidate(actor('recruiter'), {
    firstName: 'Priya',
    lastName: 'Iyer',
    email: 'priya.iyer@example.com',
    source: 'referral',
    consentStatus: 'granted',
    skills: ['typescript', 'python', 'rag', 'llm', 'postgresql'],
    experienceYears: 4
  });

  const resume = service.addResume(actor('recruiter'), candidate.id, {
    fileName: 'priya-resume.txt',
    text: 'Backend engineer with TypeScript, Python, RAG, LLM, PostgreSQL and AI systems experience.',
    parsedSkills: ['typescript', 'python', 'rag', 'llm', 'postgresql', 'fastapi'],
    experienceYears: 4,
    education: ['B.Tech']
  });
  assert.equal(resume.candidateId, candidate.id);

  const matches = service.matchCandidatesForJob(actor('recruiter'), 'job_ai_engineer', 5);
  assert.ok(matches.some((match) => match.candidate.id === candidate.id));
  const priya = matches.find((match) => match.candidate.id === candidate.id);
  assert.ok(priya.score >= 90);
  assert.ok(priya.matchedSkills.includes('rag'));
});

test('Application can be created, moved through pipeline, interviewed, and scored', () => {
  const { service } = freshService('application-flow');
  const candidate = service.createCandidate(actor('recruiter'), {
    firstName: 'Dev',
    lastName: 'Kumar',
    email: 'dev.kumar@example.com',
    source: 'manual',
    consentStatus: 'granted',
    skills: ['typescript', 'python', 'rag', 'llm', 'postgresql'],
    experienceYears: 5
  });

  const application = service.applyCandidate(actor('recruiter'), {
    jobId: 'job_ai_engineer',
    candidateId: candidate.id,
    source: 'manual'
  });
  assert.equal(application.status, 'applied');
  assert.ok(application.matchScore >= 90);

  const screenStage = service.listPipelineStages(actor('recruiter'), 'job_ai_engineer').find((stage) => stage.type === 'screening');
  const moved = service.moveApplication(actor('recruiter'), application.id, { stageId: screenStage.id, note: 'Passed initial review' });
  assert.equal(moved.status, 'screening');

  const interview = service.scheduleInterview(actor('hiring_manager'), {
    applicationId: application.id,
    title: 'Technical round',
    interviewType: 'technical',
    scheduledAt: '2026-05-25T09:00:00.000Z',
    interviewerUserIds: ['hm_001']
  });
  assert.equal(interview.status, 'scheduled');

  const completed = service.updateInterviewStatus(actor('hiring_manager'), interview.id, 'completed', 'Completed successfully');
  assert.equal(completed.status, 'completed');
  assert.ok(completed.completedAt);

  const scorecard = service.submitScorecard(actor('interviewer', 'hm_001'), {
    interviewId: interview.id,
    criteriaScores: { backend: 5, ai: 5, communication: 4 },
    recommendation: 'strong_yes',
    strengths: ['Architecture', 'AI systems']
  });
  assert.equal(scorecard.recommendation, 'strong_yes');

  const detailed = service.getApplication(actor('recruiter'), application.id);
  assert.ok(detailed.rating >= 4.5);
  assert.equal(detailed.scorecards.length, 1);
});

test('Offer approval, sending, acceptance, and hiring flow work', () => {
  const { service } = freshService('offer-flow');
  const candidate = service.createCandidate(actor('recruiter'), {
    firstName: 'Karan',
    lastName: 'Nair',
    email: 'karan.nair@example.com',
    source: 'linkedin',
    consentStatus: 'granted',
    skills: ['typescript', 'python', 'rag', 'llm', 'postgresql'],
    experienceYears: 6
  });
  const application = service.applyCandidate(actor('recruiter'), { jobId: 'job_ai_engineer', candidateId: candidate.id, source: 'linkedin' });

  const offer = service.createOffer(actor('offer_manager'), {
    applicationId: application.id,
    title: 'AI Platform Engineer Offer',
    compensation: { currency: 'INR', baseSalary: 2600000, bonus: 250000, benefits: ['health insurance'] },
    startDate: '2026-06-15T00:00:00.000Z',
    approvals: [{ approverUserId: 'hm_001' }],
    terms: ['Full-time', 'Confidentiality agreement']
  });
  assert.equal(offer.status, 'pending_approval');

  const approved = service.approveOffer(actor('hiring_manager', 'hm_001'), offer.id, { decision: 'approved', comment: 'Within budget' });
  assert.equal(approved.status, 'approved');

  const sent = service.sendOffer(actor('offer_manager'), offer.id);
  assert.equal(sent.status, 'sent');

  const accepted = service.acceptOffer(actor('hr_manager'), offer.id);
  assert.equal(accepted.status, 'accepted');

  const app = service.getApplication(actor('hr_manager'), application.id);
  assert.equal(app.status, 'hired');
  assert.ok(app.hiredAt);
});

test('Talent pools, analytics, events, audit logs, permissions, and routes are available', () => {
  const { service } = freshService('ops');
  const candidate = service.createCandidate(actor('recruiter'), {
    firstName: 'Maya',
    lastName: 'Sen',
    email: 'maya.sen@example.com',
    source: 'agency',
    consentStatus: 'granted',
    skills: ['analytics', 'campaigns'],
    experienceYears: 5
  });

  const pool = service.createTalentPool(actor('recruiter'), {
    name: 'Growth Bench',
    tags: ['growth'],
    candidateIds: []
  });
  const updatedPool = service.addCandidateToPool(actor('recruiter'), pool.id, candidate.id);
  assert.ok(updatedPool.candidateIds.includes(candidate.id));

  const analytics = service.analytics(actor('auditor'));
  assert.equal(analytics.totals.jobs, 2);
  assert.ok(analytics.averageMatchScore > 0);
  assert.equal(analytics.applicationsBySource.linkedin, 1);

  assert.ok(service.listEvents(actor('auditor')).some((event) => event.type === 'career.pool.member_added'));
  assert.ok(service.auditLogs(actor('auditor')).some((audit) => audit.action === 'career.pool.member.add'));

  assert.equal(hasPermission('viewer', 'career.job.create'), false);
  assert.equal(hasPermission('recruiter', 'career.candidate.create'), true);

  const router = registerRoutes(new Router(), service);
  const routes = router.listRoutes();
  assert.ok(routes.some((route) => route.path === '/careeros/jobs'));
  assert.ok(routes.some((route) => route.path === '/careeros/offers/:id/accept'));
});
