# ExperienceOS

ExperienceOS is a reusable operating layer for customer experience, user journeys, feedback, surveys, support/recovery workflows, and experience analytics.

It is designed to power platforms in hospitality, healthcare, retail, services, education, food, and enterprise applications.

## Included

- Experience profile management
- Feedback capture and sentiment scoring
- Feedback triage and resolution
- Survey builder
- Survey publishing and responses
- NPS, CSAT, and CES metrics
- Journey maps
- Touchpoints
- Journey event tracking
- Support and experience recovery cases
- SLA policies and SLA evaluation
- Recovery actions
- Experience analytics dashboard data
- Event logs
- Audit logs
- Role-based permissions
- Seed demo data
- PostgreSQL schema example
- Automated tests

## Run

```bash
npm run build
npm start
```

Open:

```txt
http://localhost:4800/health
http://localhost:4800/docs
```

## Demo tenant

```txt
demo-tenant
```

Use headers:

```txt
x-role: cx_manager
x-tenant-id: demo-tenant
x-user-id: user_001
```

## Main demo IDs

```txt
prof_demo_maya
prof_demo_rahul
prof_demo_nisha
fb_demo_late_delivery
fb_demo_good_checkout
fb_demo_booking_issue
srv_demo_nps
srv_demo_csat
journey_demo_retail
tp_demo_checkout
case_demo_delivery
rec_demo_coupon
```

## Example: Capture feedback

```bash
curl -X POST http://localhost:4800/experienceos/feedback \
  -H "Content-Type: application/json" \
  -H "x-role: experience_agent" \
  -d '{
    "profileId":"prof_demo_rahul",
    "channel":"chat",
    "type":"complaint",
    "rating":2,
    "message":"Support was slow and the delivery was late.",
    "tags":["delivery","support"]
  }'
```

## Example: Create a survey

```bash
curl -X POST http://localhost:4800/experienceos/surveys \
  -H "Content-Type: application/json" \
  -H "x-role: cx_manager" \
  -d '{
    "title":"Post Delivery NPS",
    "type":"nps",
    "channel":"email",
    "questions":[
      {"label":"How likely are you to recommend us?","type":"scale","required":true,"scaleMin":0,"scaleMax":10},
      {"label":"What can we improve?","type":"text"}
    ]
  }'
```

## Example: Submit a survey response

```bash
curl -X POST http://localhost:4800/experienceos/surveys/srv_demo_nps/responses \
  -H "Content-Type: application/json" \
  -H "x-role: experience_agent" \
  -d '{
    "profileId":"prof_demo_maya",
    "npsScore":10,
    "answers":{"nps":10,"comment":"Great experience and helpful support."}
  }'
```

## Example: Create a recovery case

```bash
curl -X POST http://localhost:4800/experienceos/cases \
  -H "Content-Type: application/json" \
  -H "x-role: support_manager" \
  -d '{
    "profileId":"prof_demo_rahul",
    "subject":"Recovery for late delivery",
    "description":"Customer complained about late delivery and confusing support.",
    "type":"experience_recovery",
    "priority":"high",
    "feedbackIds":["fb_demo_late_delivery"]
  }'
```

## Architecture

```txt
ExperienceOS
├── Profiles
├── Feedback
├── Surveys
├── Survey Responses
├── NPS/CSAT/CES Metrics
├── Journey Maps
├── Touchpoints
├── Journey Events
├── Support / Recovery Cases
├── SLA Policies
├── Recovery Actions
├── Analytics
├── Events
└── Audit Logs
```

## Production note

This starter uses a JSON file store so it can run with no external dependencies. For production, replace the JSON store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/experienceos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/experience`
- Modes: standalone and PlatformOS integrated
- Related systems: ClientOS, SupportOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
