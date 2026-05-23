# FinanceOS

FinanceOS is a reusable TypeScript operating layer for finance features across Appneural platforms and ERPs.

It covers:

- Customers and vendors
- Chart of accounts
- Tax rules
- Invoices and billing
- Payments
- Refunds
- Expenses and approvals
- Subscription plans and recurring billing
- Budgets
- Double-entry ledger entries
- Profit and loss report
- Receivables aging report
- Finance analytics
- Event logs
- Audit logs
- Role-based permissions

## Stack

```txt
Runtime     Node.js >= 20
Language    TypeScript
Storage     JSON file store for starter use
Database    PostgreSQL schema included for production migration
Dependencies none
```

## Run locally

```bash
npm run build
npm start
```

Default server:

```txt
http://localhost:4900
```

Health:

```txt
GET /health
```

Docs:

```txt
GET /docs
```

## Seed data

FinanceOS starts with demo data for:

```txt
Tenant: demo-tenant
Customers: cust_demo_acme, cust_demo_retail
Vendors: vend_demo_cloud, vend_demo_media
Tax rules: tax_gst_18, tax_gst_5, tax_zero
Invoices: inv_demo_paid, inv_demo_open
Plan: plan_demo_growth
Subscription: sub_demo_acme
Budgets: budget_demo_marketing, budget_demo_cloud
```

Reset seed data:

```bash
npm run reset
```

## Headers

Use these headers when calling protected APIs:

```txt
x-tenant-id: demo-tenant
x-user-id: admin-user
x-role: finance_admin
```

Supported roles:

```txt
viewer
finance_clerk
billing_agent
accountant
finance_manager
tax_manager
finance_admin
admin
owner
auditor
```

## Main API examples

### Overview

```bash
curl -H "x-role: finance_admin" http://localhost:4900/financeos/overview
```

### Create customer

```bash
curl -X POST http://localhost:4900/financeos/customers \
  -H "Content-Type: application/json" \
  -H "x-role: finance_admin" \
  -d '{
    "displayName": "New Client Pvt Ltd",
    "email": "finance@newclient.example",
    "paymentTermsDays": 15
  }'
```

### Create invoice

```bash
curl -X POST http://localhost:4900/financeos/invoices \
  -H "Content-Type: application/json" \
  -H "x-role: finance_admin" \
  -d '{
    "customerId": "cust_demo_acme",
    "lineItems": [
      {
        "description": "CommerceOS implementation",
        "quantity": 1,
        "unitPrice": 5000,
        "taxRuleId": "tax_gst_18"
      }
    ]
  }'
```

### Send invoice

```bash
curl -X POST http://localhost:4900/financeos/invoices/INVOICE_ID/send \
  -H "x-role: finance_admin"
```

### Record payment

```bash
curl -X POST http://localhost:4900/financeos/payments \
  -H "Content-Type: application/json" \
  -H "x-role: finance_admin" \
  -d '{
    "invoiceId": "INVOICE_ID",
    "amount": 5900,
    "method": "upi"
  }'
```

### Create expense

```bash
curl -X POST http://localhost:4900/financeos/expenses \
  -H "Content-Type: application/json" \
  -H "x-role: finance_admin" \
  -d '{
    "vendorId": "vend_demo_cloud",
    "category": "Cloud",
    "description": "Server hosting",
    "amount": 2500,
    "taxAmount": 450
  }'
```

### Reports

```txt
GET /financeos/reports/profit-loss
GET /financeos/reports/aging
```

## Development structure

```txt
src/
 ├── core/
 │    ├── datastore.ts
 │    ├── domain.ts
 │    ├── event-bus.ts
 │    ├── http.ts
 │    └── security.ts
 │
 ├── engines/
 │    ├── tax-engine.ts
 │    └── ledger-engine.ts
 │
 ├── services/
 │    └── finance.service.ts
 │
 ├── modules/
 │    └── routes.ts
 │
 ├── seed-state.ts
 └── main.ts
```

## Production notes

This starter uses a JSON file store so it can run without installing a database. For production:

1. Replace `DataStore` with PostgreSQL repositories.
2. Use the schema in `database/schema.sql`.
3. Add idempotency keys for payment and refund APIs.
4. Integrate real payment gateways and tax engines.
5. Enforce SecurityOS permissions centrally.
6. Publish `finance.*` events to AutomationOS and AnalyticsOS.
7. Add background jobs for recurring subscription billing and overdue invoice detection.

## Tests

```bash
npm test
```

The test suite covers:

- Seed overview and analytics
- Invoice creation, send, payment, and ledger posting
- Refund processing
- Expense submission, approval, payment, budgets, and P&L
- Subscription invoice generation
- Role permissions

## Planning Alignment

- Official package: `@appneurox/financeos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/finance`
- Modes: standalone and PlatformOS integrated
- Related systems: CommerceOS, BusinessOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
