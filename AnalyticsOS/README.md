# AnalyticsOS

**AnalyticsOS: Analytics operating system for APPNEURAL platforms**

AnalyticsOS provides comprehensive analytics capabilities including dashboards, KPIs, reports, event analytics, funnel analytics, cohort analysis, and business intelligence.

## Features

- **Dashboards**: Customizable views with widgets showing KPIs, charts, tables, and metrics
- **KPIs**: Key performance indicators with formulas, targets, and thresholds
- **Metrics**: Measurable data points from events or data sources
- **Reports**: Structured documents with sections for scheduling and export
- **Events**: Trackable user or system actions with properties
- **Funnels**: Conversion analysis with step-by-step user journeys
- **Cohorts**: User group analysis for retention and behavior patterns
- **Segments**: Dynamic user groups defined by conditions
- **Alerts**: Automated notifications when metrics breach thresholds
- **Forecasts**: Predictive analytics using various methods
- **Goals**: Measurable targets with progress tracking
- **Insights**: Auto-generated observations about data patterns

## Quick Start

```bash
cd AnalyticsOS
npm install
npm run build
npm start
```

Server will start on `http://localhost:7400`

## API Documentation

- **Health**: `GET /health`
- **Docs**: `GET /docs`
- **Overview**: `GET /analyticsos/overview` (requires `analytics.overview.view` permission)

## Authentication

Use headers to authenticate:

- `x-role`: Role (owner, admin, analytics_admin, analyst, dashboard_viewer, viewer)
- `x-tenant-id`: Tenant ID (defaults to demo-tenant)
- `x-user-id`: User ID

## Core Entities

### Dashboard

Customizable view with widgets:

```json
{
  "key": "sales_overview",
  "name": "Sales Overview",
  "description": "Executive view of sales metrics",
  "status": "active",
  "ownerId": "user_demo",
  "tags": ["sales", "executive"],
  "layout": { "columns": 12, "rowHeight": 50, "theme": "light" },
  "widgets": []
}
```

### KPI

Key performance indicator:

```json
{
  "key": "monthly_revenue",
  "name": "Monthly Revenue",
  "category": "business",
  "formula": "sum(revenue)",
  "format": "currency",
  "currentValue": 125000,
  "targetValue": 150000,
  "threshold": { "warning": 100000, "critical": 75000 }
}
```

### Event

Trackable action:

```json
{
  "name": "user_signed_up",
  "userId": "user_123",
  "source": "CareerOS",
  "properties": { "plan": "free", "source": "organic" }
}
```

### Funnel

Conversion analysis:

```json
{
  "key": "signup_to_paid",
  "name": "Signup to Paid Conversion",
  "steps": [
    { "name": "Signup", "eventName": "user_signed_up", "order": 1 },
    { "name": "Upgrade", "eventName": "plan_upgraded", "order": 2 }
  ],
  "dateRange": { "start": "2026-01-01", "end": "2026-12-31" }
}
```

## API Endpoints

### Dashboards

- `GET /analyticsos/dashboards` - List dashboards
- `POST /analyticsos/dashboards` - Create dashboard
- `GET /analyticsos/dashboards/:id` - Get dashboard
- `PATCH /analyticsos/dashboards/:id` - Update dashboard
- `POST /analyticsos/dashboards/:id/widgets` - Add widget

### KPIs

- `GET /analyticsos/kpis` - List KPIs
- `POST /analyticsos/kpis` - Create KPI
- `GET /analyticsos/kpis/:id` - Get KPI
- `PATCH /analyticsos/kpis/:id` - Update KPI

### Metrics

- `GET /analyticsos/metrics` - List metrics
- `POST /analyticsos/metrics` - Create metric

### Reports

- `GET /analyticsos/reports` - List reports
- `POST /analyticsos/reports` - Create report

### Events

- `POST /analyticsos/events` - Track event
- `GET /analyticsos/events` - List events

### Funnels

- `GET /analyticsos/funnels` - List funnels
- `POST /analyticsos/funnels` - Create funnel
- `GET /analyticsos/funnels/:id` - Get funnel

### Cohorts

- `GET /analyticsos/cohorts` - List cohorts
- `POST /analyticsos/cohorts` - Create cohort

### Segments

- `GET /analyticsos/segments` - List segments
- `POST /analyticsos/segments` - Create segment

### Alerts

- `GET /analyticsos/alerts/rules` - List alert rules
- `POST /analyticsos/alerts/rules` - Create alert rule
- `GET /analyticsos/alerts` - List alerts
- `PATCH /analyticsos/alerts/:id/acknowledge` - Acknowledge alert
- `PATCH /analyticsos/alerts/:id/resolve` - Resolve alert

### Goals

- `GET /analyticsos/goals` - List goals
- `POST /analyticsos/goals` - Create goal

### Forecasts

- `GET /analyticsos/forecasts` - List forecasts
- `POST /analyticsos/forecasts` - Create forecast

### Insights

- `GET /analyticsos/insights` - List insights

### Audit

- `GET /analyticsos/audit` - List audit logs

## Role-Based Access Control

### Roles

- **owner**: Full access to all resources
- **admin**: Full access to all resources
- **analytics_admin**: Analytics management capabilities
- **analyst**: Read and analyze data
- **dashboard_viewer**: View dashboards and KPIs
- **viewer**: View dashboards and KPIs

### Permissions

AnalyticsOS uses granular permissions for resource access:

- `analytics.dashboard.read` / `write` / `delete`
- `analytics.report.read` / `write`
- `analytics.event.read` / `write`
- `analytics.kpi.read` / `write` / `delete`
- `analytics.funnel.read` / `write` / `delete`
- `analytics.alert.read` / `write` / `delete`
- `analytics.forecast.read` / `write`
- `analytics.goal.read` / `write`
- `analytics.segment.read` / `write`
- `analytics.cohort.read` / `write`
- `analytics.insight.read` / `write`
- `analytics.audit.read`

## Architecture

AnalyticsOS follows the standard APPNEURAL OS architecture:

```
src/
├── core/           # Core utilities and infrastructure
│   ├── domain.ts   # Entity definitions
│   ├── datastore.ts # JSON file storage
│   ├── http.ts     # HTTP server and routing
│   ├── id.ts       # ID generation
│   ├── utils.ts    # Utility functions
│   ├── errors.ts   # Error handling
│   ├── security.ts # Role-based access control
│   └── event-bus.ts # Event publishing
├── modules/
│   └── routes.ts   # API route definitions
├── service.ts      # Business logic
├── docs.ts         # API documentation
├── seed-state.ts   # Demo data
└── main.ts         # Entry point
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 7400)
- `ANALYTICSOS_DB_FILE`: Path to JSON database file (default: data/analyticsos.db.json)
- `DEFAULT_TENANT_ID`: Default tenant ID (default: demo-tenant)

### Example

```bash
PORT=7400 ANALYTICSOS_DB_FILE=data/analyticsos.db.json npm start
```

## Development

### Build

```bash
npm run build
```

### Run

```bash
npm start
```

### Reset Data

```bash
npm run reset
```

### Test

```bash
npm test
```

## Data Storage

AnalyticsOS uses JSON file storage by default. Data is persisted to `data/analyticsos.db.json`.

## Example Usage

### Create a Dashboard

```bash
curl -X POST http://localhost:7400/analyticsos/dashboards \
  -H "Content-Type: application/json" \
  -H "x-role: analytics_admin" \
  -d '{
    "key": "my_dashboard",
    "name": "My Dashboard",
    "ownerId": "user_demo",
    "layout": { "columns": 12, "rowHeight": 50, "theme": "light" }
  }'
```

### Track an Event

```bash
curl -X POST http://localhost:7400/analyticsos/events \
  -H "Content-Type: application/json" \
  -H "x-role: analytics_admin" \
  -d '{
    "name": "button_clicked",
    "userId": "user_123",
    "source": "WebApp",
    "properties": { "button": "signup", "location": "homepage" }
  }'
```

### Create a KPI

```bash
curl -X POST http://localhost:7400/analyticsos/kpis \
  -H "Content-Type: application/json" \
  -H "x-role: analytics_admin" \
  -d '{
    "key": "daily_active_users",
    "name": "Daily Active Users",
    "category": "product",
    "formula": "count(distinct events.where(name='user_active'))",
    "format": "number",
    "targetValue": 50000
  }'
```

## License

MIT

## Related Systems

- PlatformOS - Core platform services
- DataOS - Data management and pipelines
- AIOS - AI and machine learning capabilities
## Related OSs

- platformos
- securityos
