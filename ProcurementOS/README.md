# ProcurementOS

Purchase requests, vendor management, approvals, purchase orders, goods receipts, and procurement lifecycle management for APPNEURAL.

## Quick Start

```bash
cd ProcurementOS

npm install
npm run build
npm start
```

ProcurementOS will run on **http://localhost:11100**

## API Endpoints

### Health & Docs
- `GET /health` - Health check
- `GET /docs` - API documentation

### Overview
- `GET /procurementos/overview` - Get procurement overview

### Vendors
- `GET /procurementos/vendors` - List vendors
- `POST /procurementos/vendors` - Create vendor

### Purchase Requests
- `GET /procurementos/requests` - List purchase requests
- `POST /procurementos/requests` - Create purchase request
- `GET /procurementos/requests/:id` - Get purchase request
- `POST /procurementos/requests/:id/submit` - Submit purchase request
- `POST /procurementos/requests/:id/approve` - Approve purchase request
- `POST /procurementos/requests/:id/reject` - Reject purchase request

### Purchase Orders
- `GET /procurementos/purchase-orders` - List purchase orders
- `POST /procurementos/purchase-orders` - Create purchase order
- `GET /procurementos/purchase-orders/:id` - Get purchase order
- `POST /procurementos/purchase-orders/:id/send` - Send purchase order
- `POST /procurementos/purchase-orders/:id/acknowledge` - Acknowledge purchase order

### Receipts
- `GET /procurementos/receipts` - List receipts
- `GET /procurementos/receipts/:id` - Get receipt
- `POST /procurementos/receipts` - Create receipt

### RFQs
- `GET /procurementos/rfqs` - List RFQs
- `POST /procurementos/rfqs` - Create RFQ

### Quotes
- `GET /procurementos/quotes` - List quotes
- `POST /procurementos/quotes` - Create quote

### Budgets
- `GET /procurementos/budgets` - List budget allocations
- `GET /procurementos/budgets/:id` - Get budget allocation

### Audit & Events
- `GET /procurementos/audit` - List audit logs
- `GET /procurementos/events` - List events

## Authentication

Set the following headers:
- `x-role`: owner, admin, procurement_manager, procurement_analyst, approver, requester, or viewer
- `x-tenant-id`: Your tenant ID (defaults to demo-tenant)
- `x-user-id`: Your user ID

## Environment Variables

- `PORT`: Server port (default: 11100)
- `PROCUREMENTOS_DB_FILE`: Database file path (default: data/procurementos.db.json)
- `DEFAULT_TENANT_ID`: Default tenant ID (default: demo-tenant)

## Core Entities

- **Vendor**: Suppliers providing goods or services
- **PurchaseRequest**: Internal requests for purchasing items or services
- **PurchaseOrder**: Formal orders issued to vendors
- **Receipt**: Goods or services received from vendors
- **Approval**: Workflow for authorizing purchases
- **RFQ**: Request for Quotation sent to vendors
- **Quote**: Vendor price quotations
- **BudgetAllocation**: Budget tracking by department/project

## Example Usage

```bash
# Create a purchase request
curl -X POST http://localhost:11100/procurementos/requests \
  -H "Content-Type: application/json" \
  -H "x-role: requester" \
  -d '{
    "title": "Laptop Purchase",
    "department": "Engineering",
    "category": "Hardware",
    "items": [
      {
        "description": "Laptop - Dell XPS 15",
        "quantity": 5,
        "unitPrice": 95000,
        "totalPrice": 475000
      }
    ]
  }'

# Approve a purchase request
curl -X POST http://localhost:11100/procurementos/requests/pr_xxx/approve \
  -H "Content-Type: application/json" \
  -H "x-role: approver" \
  -d '{"comments": "Approved for Q3 budget"}'
```

## Development

```bash
# Build
npm run build

# Start
npm start

# Development mode (build + start)
npm run dev

# Reset database and reseed
npm run reset

# Reseed database
npm run seed
```

## Architecture

ProcurementOS follows the same patterns as other APPNEURAL OS systems:

- **HTTP Server**: Built on Node.js http module
- **Router**: Custom router with parameter support
- **DataStore**: JSON file-based storage
- **Service Layer**: Business logic separated from HTTP handling
- **Domain Models**: TypeScript interfaces for all entities

## Port Configuration

ProcurementOS runs on **port 11100** by default.

## License

MIT
## Related OSs

- platformos
- securityos
