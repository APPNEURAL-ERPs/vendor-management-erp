# MarketplaceOS

**MarketplaceOS** is the ecosystem distribution engine for APPNEURAL platforms, enabling publishing, discovering, buying, installing, licensing, reviewing, and managing OS modules, tools, templates, workflows, agents, connectors, plugins, themes, APIs, datasets, prompts, and service packs.

## Quick Start

```bash
cd MarketplaceOS
npm install
npm run build
npm start
```

The server runs on **http://localhost:10600**

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /docs` - API documentation
- `GET /permissions` - Role permissions
- `GET /marketplaceos/overview` - Marketplace overview

### Categories
- `GET /marketplaceos/categories` - List categories
- `POST /marketplaceos/categories` - Create category

### Listings
- `GET /marketplaceos/listings` - List listings (supports filters: search, categoryId, sellerId, type, status, featured, trending)
- `POST /marketplaceos/listings` - Create listing
- `GET /marketplaceos/listings/:id` - Get listing
- `PATCH /marketplaceos/listings/:id` - Update listing
- `POST /marketplaceos/listings/:id/publish` - Publish listing

### Sellers
- `GET /marketplaceos/sellers` - List sellers
- `POST /marketplaceos/sellers` - Create seller
- `GET /marketplaceos/sellers/:id` - Get seller

### Buyers
- `GET /marketplaceos/buyers` - List buyers
- `POST /marketplaceos/buyers` - Create buyer

### Orders
- `GET /marketplaceos/orders` - List orders (supports filters: buyerId, sellerId, listingId, status)
- `POST /marketplaceos/orders` - Create order
- `GET /marketplaceos/orders/:id` - Get order
- `PATCH /marketplaceos/orders/:id` - Update order status

### Reviews
- `GET /marketplaceos/reviews` - List reviews (supports filters: listingId, status, verified)
- `POST /marketplaceos/reviews` - Create review

### Payouts
- `GET /marketplaceos/payouts` - List payouts (supports filters: sellerId, status)
- `POST /marketplaceos/payouts` - Create payout

### Licenses
- `GET /marketplaceos/licenses` - List licenses (supports filters: buyerId, listingId)
- `POST /marketplaceos/licenses` - Create license

### Installs
- `GET /marketplaceos/installs` - List installs (supports filters: listingId, status)
- `POST /marketplaceos/installs` - Create install

### Cart
- `GET /marketplaceos/cart` - Get cart
- `POST /marketplaceos/cart` - Add to cart
- `DELETE /marketplaceos/cart` - Clear cart

### Search
- `GET /marketplaceos/search?q=<query>` - Search listings, categories, and sellers

### Audit
- `GET /marketplaceos/audit` - Audit logs

## Authentication

Use headers:
- `x-role`: owner | admin | marketplace_admin | seller | buyer | viewer
- `x-tenant-id`: tenant id (defaults to demo-tenant)
- `x-user-id`: actor id

## Listing Types

- `module` - OS modules and extensions
- `tool` - Reusable tools and utilities
- `template` - Website, document, and workflow templates
- `workflow` - Automation workflow packs
- `agent` - AI agents and assistants
- `connector` - External system integrations
- `plugin` - Platform extensibility extensions
- `theme` - UI and brand customization packs
- `api` - API services and endpoints
- `dataset` - Data packs and reusable datasets
- `prompt` - Reusable AI prompts
- `service` - Implementation and service packages
- `micro-erp` - Industry-specific ERP packs
- `other` - Miscellaneous items

## Pricing Models

- `free` - No cost
- `one_time` - Single payment
- `subscription` - Recurring payment (monthly/yearly)
- `credit` - Credit-based usage
- `usage` - Usage-based billing
- `enterprise` - Custom enterprise pricing

## Core Entities

- **Marketplace** - Central hub
- **Listing** - Publishable marketplace item
- **Seller** - Creator or vendor
- **Buyer** - Customer
- **Order** - Purchase transaction
- **License** - Usage rights
- **Install** - Instance in tenant workspace
- **Review** - Buyer feedback and rating
- **Payout** - Revenue transfer
- **Commission** - Platform fee structure
- **Bundle** - Multiple items sold together
- **Cart** - Shopping cart

## Demo Data

Seed data includes:
- 5 Categories (OS Modules, Tools, Templates, Workflows, AI Agents)
- 3 Sellers (APPNEURAL internal, TechPartner Solutions, DevAgency Studio)
- 5 Listings (CareerOS Starter Kit, ATS Checker, Invoice Workflow, Agency Template, Support Agent)
- 2 Buyers
- 2 Reviews

## Commands

```bash
npm run build   # Compile TypeScript
npm start       # Start server
npm run dev     # Build and start
npm run reset   # Reset database and reseed
```

## Architecture

```
MarketplaceOS/
├── manifest.json        # OS manifest
├── package.json        # NPM package
├── tsconfig.json       # TypeScript config
├── src/
│   ├── main.ts         # HTTP server entry point
│   ├── domain.ts       # Type definitions
│   ├── service.ts      # Business logic
│   ├── docs.ts         # API documentation
│   ├── seed-state.ts   # Demo data
│   └── core/
│       ├── id.ts       # ID generation
│       ├── utils.ts    # Utility functions
│       ├── datastore.ts # JSON file storage
│       └── errors.ts   # Error handling
└── data/
    └── marketplaceos.db.json
```

## MarketplaceOS in the APPNEURAL Ecosystem

```
MarketplaceOS = catalog + listings + sellers + buyers + checkout + install + licenses + revenue share
```

**Key Integrations:**
- **ToolOS** - Tool listings
- **WorkflowOS** - Workflow packs
- **TemplateOS** - Template marketplace
- **AgenticOS** - Agent marketplace
- **IntegrationOS** - Connector marketplace
- **PlatformOS** - Module marketplace
- **BillingOS** - Checkout, invoices, payouts
- **SearchOS** - Marketplace discovery
- **AuditOS** - Marketplace activity history
- **PolicyOS** - Marketplace rules
- **SecurityOS** - Marketplace safety review
## Related OSs

- platformos
- billingos
- securityos
