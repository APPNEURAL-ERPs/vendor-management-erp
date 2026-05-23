# CareerOS

CareerOS is a complete runnable TypeScript starter for the Appneural recruiting operating layer.

It provides reusable hiring functionality for platforms such as JoblyUp, corporate ERPs, internal HR tools, and staffing workflows.

## Included modules

- Job requisitions
- Candidate CRM
- Resume storage and parsing fields
- Applications
- Hiring pipeline stages
- Interview scheduling
- Scorecards and interviewer feedback
- Offer approval, sending, acceptance, decline, revoke
- Talent pools
- Candidate-to-job matching engine
- Recruiting analytics
- Event logs
- Audit logs
- Role-based API permissions
- Seed demo data
- PostgreSQL schema starter
- Node test suite

## Run

```bash
npm run build
npm start
```

Open:

```txt
http://localhost:4500/health
http://localhost:4500/docs
```

## Reset demo data

```bash
npm run reset
```

## Test

```bash
npm test
```

## Authentication headers

CareerOS uses simple request headers for local development.

```txt
x-tenant-id: demo-tenant
x-user-id: user-001
x-role: career_admin
```

Supported roles:

```txt
owner
admin
career_admin
recruiter
hiring_manager
interviewer
hr_manager
offer_manager
auditor
viewer
```

## Demo IDs

```txt
Tenant: demo-tenant
Jobs: job_ai_engineer, job_growth_manager
Candidates: cand_asha, cand_rahul, cand_neha
Applications: app_asha_ai, app_rahul_ai, app_neha_growth
Interview: int_asha_ai
Offer: offer_neha_growth
Talent pool: pool_ai_backend
```

## Example API calls

Create a job:

```bash
curl -X POST http://localhost:4500/careeros/jobs \
  -H "Content-Type: application/json" \
  -H "x-role: recruiter" \
  -d '{
    "code": "DEVREL-001",
    "title": "Developer Advocate",
    "department": "DevRel",
    "location": "Remote",
    "requiredSkills": ["typescript", "apis", "content"],
    "niceToHaveSkills": ["public speaking"],
    "experienceMinYears": 3,
    "description": "Build developer education and adoption."
  }'
```

Create a candidate:

```bash
curl -X POST http://localhost:4500/careeros/candidates \
  -H "Content-Type: application/json" \
  -H "x-role: recruiter" \
  -d '{
    "firstName": "Priya",
    "lastName": "Iyer",
    "email": "priya.iyer@example.com",
    "source": "referral",
    "consentStatus": "granted",
    "skills": ["typescript", "apis", "content"],
    "experienceYears": 4
  }'
```

Apply a candidate:

```bash
curl -X POST http://localhost:4500/careeros/applications \
  -H "Content-Type: application/json" \
  -H "x-role: recruiter" \
  -d '{
    "jobId": "job_ai_engineer",
    "candidateId": "cand_asha",
    "source": "linkedin"
  }'
```

Find matching candidates:

```bash
curl -H "x-role: recruiter" http://localhost:4500/careeros/jobs/job_ai_engineer/matches
```

Create an offer:

```bash
curl -X POST http://localhost:4500/careeros/offers \
  -H "Content-Type: application/json" \
  -H "x-role: offer_manager" \
  -d '{
    "applicationId": "app_asha_ai",
    "title": "AI Platform Engineer Offer",
    "compensation": {
      "currency": "INR",
      "baseSalary": 2400000,
      "benefits": ["health insurance", "remote setup"]
    },
    "approvals": [{ "approverUserId": "hm_001" }],
    "terms": ["Full-time", "Standard confidentiality agreement"]
  }'
```

## Production notes

The starter uses a JSON file store in `data/careeros.db.json` so it can run without external dependencies. For production, replace `DataStore` with PostgreSQL using `database/schema.sql`.

Suggested integrations:

```txt
CareerOS -> AnalyticsOS: hiring funnel and recruiter KPIs
CareerOS -> AutomationOS: interview reminders and offer approvals
CareerOS -> PeopleOS: convert hired candidate into employee
CareerOS -> FinanceOS: offer budgets and compensation approvals
CareerOS -> WebsiteOS: career site job listings
CareerOS -> AIOS: resume parsing, job matching, and interview summarization
SecurityOS -> CareerOS: RBAC, audit, and compliance
```

## Planning Alignment

- Official package: `@appneurox/careeros`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/career`
- Modes: standalone and PlatformOS integrated
- Related systems: PeopleOS, LearningOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
