# LegalOS

LegalOS is the legal document, contract, agreement, policy, clause, risk, obligation, approval, compliance, and legal workflow layer of the APPNEURAL ecosystem.

## Purpose

LegalOS helps businesses create, manage, review, approve, track, and organize legal documents, contracts, agreements, policies, and obligations.

## Quick Start

```bash
# Build the project
npm run build

# Start the server
npm start

# Reset database
npm run reset
```

## Server

- **Port**: 9600 (configurable via PORT environment variable)
- **Health Check**: http://localhost:9600/health
- **API Docs**: http://localhost:9600/docs

## Core Entities

- **LegalCase**: Litigation, arbitration, mediation, and corporate matters
- **LegalMatter**: Groups of related cases and documents
- **LegalDocument**: Contracts, agreements, policies, notices
- **Contract**: Formal contracts with parties, clauses, obligations, and signatures
- **NDA**: Non-disclosure agreements
- **Counsel**: Legal counsel and attorneys
- **LegalInvoice**: Legal services invoices
- **LegalHold**: Evidence preservation during litigation
- **Dispute**: Disputes tracked from open to resolution
- **IPAsset**: Intellectual property assets
- **ApprovalRequest**: Approval workflows
- **LegalTemplate**: Reusable legal templates

## API Endpoints

### Cases
- `GET /legalos/cases` - List all cases
- `POST /legalos/cases` - Create a case
- `GET /legalos/cases/:id` - Get case by ID
- `PATCH /legalos/cases/:id` - Update a case

### Matters
- `GET /legalos/matters` - List all matters
- `POST /legalos/matters` - Create a matter
- `GET /legalos/matters/:id` - Get matter by ID

### Contracts
- `GET /legalos/contracts` - List all contracts
- `POST /legalos/contracts` - Create a contract
- `GET /legalos/contracts/:id` - Get contract by ID
- `PATCH /legalos/contracts/:id` - Update a contract
- `POST /legalos/contracts/:id/clauses` - Add clause to contract

### NDAs
- `GET /legalos/ndas` - List all NDAs
- `POST /legalos/ndas` - Create an NDA
- `GET /legalos/ndas/:id` - Get NDA by ID

### Counsel
- `GET /legalos/counsel` - List all counsel
- `POST /legalos/counsel` - Create counsel
- `GET /legalos/counsel/:id` - Get counsel by ID

### Invoices
- `GET /legalos/invoices` - List all invoices
- `POST /legalos/invoices` - Create an invoice
- `GET /legalos/invoices/:id` - Get invoice by ID

### Documents
- `GET /legalos/documents` - List all documents
- `POST /legalos/documents` - Create a document
- `GET /legalos/documents/:id` - Get document by ID

### Legal Holds
- `GET /legalos/holds` - List all legal holds
- `POST /legalos/holds` - Create a legal hold
- `GET /legalos/holds/:id` - Get legal hold by ID

### Disputes
- `GET /legalos/disputes` - List all disputes
- `POST /legalos/disputes` - Create a dispute
- `GET /legalos/disputes/:id` - Get dispute by ID

### IP Assets
- `GET /legalos/ip-assets` - List all IP assets
- `POST /legalos/ip-assets` - Create an IP asset
- `GET /legalos/ip-assets/:id` - Get IP asset by ID

### Approvals
- `GET /legalos/approvals` - List all approval requests
- `POST /legalos/approvals` - Create an approval request
- `GET /legalos/approvals/:id` - Get approval by ID

### Templates
- `GET /legalos/templates` - List all templates

### Notices
- `GET /legalos/notices` - List all notices

### Overview
- `GET /legalos/overview` - Get legal overview and statistics

### Audit
- `GET /legalos/audit` - Get audit logs
- `GET /legalos/events` - Get legal events

## Authentication

Use HTTP headers to authenticate requests:

- `x-role`: Role (owner, admin, legal_admin, legal_counsel, paralegal, viewer)
- `x-tenant-id`: Tenant ID (defaults to demo-tenant)
- `x-user-id`: User ID (defaults to demo-user)

## Example Usage

```bash
# Health check
curl http://localhost:9600/health

# Get overview
curl http://localhost:9600/legalos/overview

# List all cases
curl http://localhost:9600/legalos/cases

# Create a new case
curl -X POST http://localhost:9600/legalos/cases \
  -H "Content-Type: application/json" \
  -d '{
    "caseNumber": "CASE-2024-002",
    "title": "New Contract Dispute",
    "caseType": "litigation",
    "status": "open",
    "priority": "high"
  }'
```

## Project Structure

```
LegalOS/
├── manifest.json          # OS manifest
├── package.json           # NPM package
├── tsconfig.json          # TypeScript config
├── data/                  # Database files
│   └── legalos.db.json    # JSON database
└── src/
    ├── main.ts            # Entry point
    ├── domain.ts          # Entity definitions
    ├── docs.ts            # API documentation
    ├── seed-state.ts      # Demo data
    ├── service.ts         # Business logic
    └── core/
        ├── datastore.ts   # Data storage
        ├── http.ts        # HTTP router
        ├── id.ts          # ID generation
        ├── routes.ts      # API routes
        └── utils.ts       # Utility functions
```

## License

MIT
## Related OSs

- platformos
- securityos
