# CommerceOS

**CommerceOS** is the ecommerce, retail, product catalog, inventory, orders, payments, subscriptions, and commerce growth layer of the APPNEURAL ecosystem.

## Purpose

> CommerceOS helps businesses sell products online/offline, manage catalog, orders, inventory, customers, payments, returns, offers, and sales growth.

## Quick Start

```bash
cd CommerceOS
npm install
npm run dev
```

The service will start on **http://localhost:8700**

## Features

### Core Commerce Operations
- **Product Catalog** - Physical, digital, service, subscription, bundle, course products
- **Category Management** - Hierarchical product organization
- **Inventory Tracking** - Stock levels, reservations, low stock alerts
- **Cart Management** - Shopping cart with items, totals, discounts
- **Checkout Flow** - Session-based checkout with address and payment selection
- **Order Management** - Full order lifecycle from pending to delivered
- **Payment Processing** - Track payment status and gateway transactions
- **Refund Handling** - Request and process refunds
- **Subscription Commerce** - Recurring billing for services
- **Customer Management** - Customer profiles, addresses, purchase history
- **Coupons & Discounts** - Percentage, fixed amount, and free shipping coupons
- **Reviews & Ratings** - Product reviews with verification
- **Commerce Analytics** - Overview dashboard with key metrics

### API Endpoints

#### Products
- `GET /commerceos/products` - List all products
- `GET /commerceos/products/:id` - Get product details
- `POST /commerceos/products` - Create product
- `PATCH /commerceos/products/:id` - Update product

#### Categories
- `GET /commerceos/categories` - List categories
- `POST /commerceos/categories` - Create category

#### Cart
- `GET /commerceos/carts` - List carts
- `POST /commerceos/carts` - Create cart
- `POST /commerceos/carts/:id/items` - Add item to cart
- `DELETE /commerceos/carts/:id/items/:productId` - Remove item
- `POST /commerceos/carts/:id/coupon` - Apply coupon

#### Checkout
- `POST /commerceos/checkout` - Initiate checkout
- `GET /commerceos/checkout/:id` - Get checkout session
- `POST /commerceos/checkout/:id/process` - Process checkout

#### Orders
- `GET /commerceos/orders` - List orders
- `GET /commerceos/orders/:id` - Get order details
- `PATCH /commerceos/orders/:id/status` - Update order status

#### Payments
- `GET /commerceos/payments` - List payments
- `POST /commerceos/payments/:id/process` - Process payment

#### Refunds
- `POST /commerceos/refunds` - Create refund request
- `POST /commerceos/refunds/:id/process` - Process refund

#### Customers
- `GET /commerceos/customers` - List customers
- `GET /commerceos/customers/:id` - Get customer details
- `POST /commerceos/customers` - Create customer

#### Subscriptions
- `GET /commerceos/subscriptions` - List subscriptions
- `POST /commerceos/subscriptions` - Create subscription

#### Coupons
- `GET /commerceos/coupons` - List coupons
- `POST /commerceos/coupons` - Create coupon

#### Reviews
- `GET /commerceos/reviews` - List reviews
- `POST /commerceos/reviews` - Create review

#### Analytics
- `GET /commerceos/overview` - Get commerce overview dashboard
- `GET /commerceos/audit-logs` - Get audit logs
- `GET /commerceos/events` - Get commerce events

#### Documentation
- `GET /health` - Health check
- `GET /docs` - API documentation

## Authentication

Use HTTP headers for authentication:

- `x-role` - User role (owner, admin, commerce_manager, order_processor, inventory_manager, viewer)
- `x-tenant-id` - Tenant ID (defaults to demo-tenant)
- `x-user-id` - User ID

## Demo Data

The system comes pre-seeded with demo data including:
- 4 product categories
- 5 products with variants (Resume Review, LinkedIn Optimization, Career Course, Resume Templates, Career Bundle)
- 2 customers
- 3 orders
- 3 payments
- 2 coupons (WELCOME10, SAVE500)
- Sample reviews and loyalty points

## Configuration

Environment variables:
- `PORT` - Server port (default: 8700)
- `COMMERCEOS_DB_FILE` - Database file path (default: data/commerceos.db.json)
- `DEFAULT_TENANT_ID` - Default tenant ID (default: demo-tenant)

## Example Usage

### Create a Product

```bash
curl -X POST http://localhost:8700/commerceos/products \
  -H "Content-Type: application/json" \
  -H "x-role: commerce_manager" \
  -d '{
    "key": "new_service",
    "name": "New Service",
    "type": "service",
    "basePrice": 1999,
    "tags": ["new", "featured"]
  }'
```

### Add Item to Cart

```bash
curl -X POST http://localhost:8700/commerceos/carts/:cartId/items \
  -H "Content-Type: application/json" \
  -H "x-role: viewer" \
  -d '{
    "productId": "prod_resume_review",
    "quantity": 1
  }'
```

### Process Checkout

```bash
curl -X POST http://localhost:8700/commerceos/checkout/:sessionId/process \
  -H "Content-Type: application/json" \
  -H "x-role: commerce_manager" \
  -d '{
    "customerEmail": "customer@example.com",
    "method": "card",
    "gateway": "razorpay"
  }'
```

## Product Types

CommerceOS supports multiple product types:
- **physical** - Physical goods requiring shipping
- **digital** - Downloadable files and templates
- **service** - Professional services and consulting
- **subscription** - Recurring billing products
- **bundle** - Package of multiple products
- **course** - Educational content
- **downloadable** - Files with license keys
- **marketplace** - Third-party vendor products

## Order Lifecycle

1. **pending** - Order created, awaiting payment
2. **confirmed** - Payment authorized/received
3. **processing** - Order being prepared
4. **packed** - Items packed for shipment
5. **shipped** - Handed to delivery carrier
6. **delivered** - Successfully delivered
7. **cancelled** - Order cancelled
8. **returned** - Items returned
9. **refunded** - Money returned
10. **failed** - Payment/order failed

## Architecture

- **TypeScript** - Type-safe codebase
- **HTTP Server** - Native Node.js HTTP server (no framework)
- **JSON Storage** - File-based JSON database
- **Event Bus** - Internal event emission for integrations
- **Audit Logging** - Complete audit trail for all operations
- **Role-Based Access** - Permission-based API access

## Related Systems

CommerceOS integrates with:
- PlatformOS - Core platform services
- SecurityOS - Authentication and authorization
- FinanceOS - Financial operations
- BillingOS - Billing and invoicing

## License

MIT
## Related OSs

- platformos
- securityos
