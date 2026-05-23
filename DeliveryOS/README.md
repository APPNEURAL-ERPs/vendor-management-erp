# DeliveryOS - Quick Start Guide

## Overview
DeliveryOS is a comprehensive delivery management system for APPNEURAL that handles:
- Delivery orders and fulfillment
- Shipment tracking
- Driver management
- Route planning
- Proof of delivery
- Delivery analytics

## Quick Start

### Start the Server
```bash
cd DeliveryOS
npm run build
node dist/main.js
```

The server runs on **http://localhost:11600**

### API Endpoints

#### Health & Documentation
- `GET /health` - Health check
- `GET /docs` - API documentation
- `GET /permissions` - Check role permissions

#### Orders
- `GET /deliveryos/orders` - List all orders
- `POST /deliveryos/orders` - Create new order
- `GET /deliveryos/orders/:id` - Get order details
- `PATCH /deliveryos/orders/:id` - Update order
- `DELETE /deliveryos/orders/:id` - Delete order
- `POST /deliveryos/orders/:id/assign` - Assign driver
- `POST /deliveryos/orders/:id/dispatch` - Dispatch order

#### Shipments
- `GET /deliveryos/shipments` - List all shipments
- `GET /deliveryos/shipments/:id` - Get shipment details
- `GET /deliveryos/shipments/:id/tracking` - Get tracking timeline
- `PATCH /deliveryos/shipments/:id/status` - Update shipment status

#### Drivers
- `GET /deliveryos/drivers` - List all drivers
- `POST /deliveryos/drivers` - Create new driver
- `GET /deliveryos/drivers/:id` - Get driver details
- `PATCH /deliveryos/drivers/:id/status` - Update driver status

#### Routes
- `GET /deliveryos/routes` - List all routes
- `POST /deliveryos/routes` - Create new route
- `GET /deliveryos/routes/:id` - Get route details

#### Proof of Delivery
- `GET /deliveryos/proofs` - List all proofs
- `POST /deliveryos/proofs` - Add proof of delivery

#### Issues
- `GET /deliveryos/issues` - List all issues
- `POST /deliveryos/issues` - Create new issue

#### Analytics
- `GET /deliveryos/overview` - Get delivery overview
- `GET /deliveryos/audit` - Get audit logs
- `GET /deliveryos/events` - Get events

### Authentication
Use headers to specify role:
```
x-role: owner | admin | delivery_manager | dispatcher | driver | viewer
x-tenant-id: your-tenant-id (optional, defaults to "demo-tenant")
x-user-id: your-user-id (optional)
```

### Example API Calls

Get overview:
```bash
curl http://localhost:11600/deliveryos/overview -H "x-role: admin"
```

List orders:
```bash
curl http://localhost:11600/deliveryos/orders -H "x-role: viewer"
```

Create order:
```bash
curl -X POST http://localhost:11600/deliveryos/orders \
  -H "Content-Type: application/json" \
  -H "x-role: delivery_manager" \
  -d '{
    "type": "physical",
    "source": "Warehouse A",
    "destination": "Client Office",
    "customerName": "ABC Corp",
    "customerPhone": "+91-9876543210",
    "items": [{"itemId": "ITEM-001", "name": "Product", "quantity": 5}]
  }'
```

Assign driver:
```bash
curl -X POST http://localhost:11600/deliveryos/orders/{order_id}/assign \
  -H "Content-Type: application/json" \
  -H "x-role: dispatcher" \
  -d '{"driverId": "driver_ajay"}'
```

## Seeded Demo Data

The system comes with demo data:
- 3 drivers (Ajay, Priya, Rajesh)
- 5 orders (workshop kits, certificates, laptop, project files, service)
- 2 shipments with tracking events
- 2 delivery zones (Jaipur, Udaipur)
- 2 SLA configurations
- 1 issue (delivery delay)

## Project Structure
```
DeliveryOS/
├── src/
│   ├── core/
│   │   ├── datastore.ts      # JSON file storage
│   │   ├── errors.ts          # HTTP error handling
│   │   ├── http.ts            # HTTP router
│   │   ├── id.ts              # ID generation utilities
│   │   ├── security.ts        # RBAC permissions
│   │   └── utils.ts           # Helper functions
│   ├── modules/
│   │   └── routes.ts          # API route definitions
│   ├── docs.ts                # API documentation
│   ├── domain.ts              # Type definitions
│   ├── main.ts                # Entry point
│   ├── seed-state.ts          # Demo data
│   └── service.ts             # Business logic
├── dist/                      # Compiled JavaScript
├── data/                      # JSON database
├── manifest.json              # OS manifest
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

## Configuration

Environment variables:
- `PORT` - Server port (default: 11600)
- `DELIVERYOS_DB_FILE` - Database file path (default: data/deliveryos.db.json)
- `DEFAULT_TENANT_ID` - Default tenant ID (default: demo-tenant)

## Next Steps

1. Add more delivery types (express, scheduled, bulk)
2. Implement route optimization
3. Add courier integrations
4. Build tracking page UI
5. Add notification webhooks
6. Implement return management
7. Add cost tracking and analytics

## Support

For more details, see:
- Planning document: `/Users/ajayprajapat/Desktopdocs/planning.md
- AIOS reference: `/Users/ajayprajapat/Desktop/APPNEURAL Engineerings/OSs/AIOS/`
## Related OSs

- platformos
- securityos
