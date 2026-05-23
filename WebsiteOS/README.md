# WebsiteOS

WebsiteOS is the website planning, page generation, SEO, AEO/GEO, CMS, landing pages, conversion, forms, performance, analytics, and publishing layer of the APPNEURAL ecosystem.

## Purpose

> WebsiteOS helps businesses, brands, products, agencies, creators, institutes, and SaaS platforms create, manage, optimize, and scale websites with strong content, SEO, design, conversion, and automation.

## Quick Start

```bash
npm install
npm run build
npm start
```

Server runs on port **9300** by default:

- Health: http://localhost:9300/health
- Docs: http://localhost:9300/docs
- Dashboard: http://localhost:9300/dashboard

## Auth Headers

Use these headers to authenticate requests:

```
x-tenant-id: demo-tenant
x-user-id: admin-user
x-role: admin
```

Available roles: `viewer`, `content_editor`, `website_admin`, `seo_manager`, `form_manager`, `analytics_viewer`, `admin`, `owner`, `publisher`

## Core Features

### Website Management
- Create and manage multiple websites
- Domain and SSL certificate tracking
- Website settings and metadata
- Deployment management

### Page Builder
- Create pages with custom sections
- Support for multiple page types (home, about, service, product, landing, blog, etc.)
- Page versioning and publishing workflow
- Section-based content management

### Landing Pages
- Campaign landing pages
- Lead generation pages
- Offer and CTA tracking
- Conversion rate monitoring

### Forms
- Multiple form types (contact, lead, quote, newsletter, demo, etc.)
- Custom field builder
- Form submission tracking
- Webhook integration

### SEO & Analytics
- SEO audit and scoring
- CRO (Conversion Rate Optimization) checks
- Analytics tracking
- Sitemap generation
- Schema markup support

### CTA Management
- Create and manage CTAs
- Track clicks and conversions
- Multiple CTA types and positions

## API Examples

### Create a Website

```bash
curl -X POST http://localhost:9300/websites \
  -H 'Content-Type: application/json' \
  -H 'x-role: admin' \
  -d '{
    "name": "My Company",
    "domain": "mycompany.com",
    "description": "Professional services"
  }'
```

### Create a Page

```bash
curl -X POST http://localhost:9300/websites/{websiteId}/pages \
  -H 'Content-Type: application/json' \
  -H 'x-role: content_editor' \
  -d '{
    "title": "Services",
    "slug": "/services",
    "pageType": "service",
    "sections": []
  }'
```

### Publish a Page

```bash
curl -X POST http://localhost:9300/pages/{pageId}/publish \
  -H 'x-role: publisher'
```

### Create a Form

```bash
curl -X POST http://localhost:9300/websites/{websiteId}/forms \
  -H 'Content-Type: application/json' \
  -H 'x-role: form_manager' \
  -d '{
    "name": "Contact Form",
    "type": "contact"
  }'
```

### Submit Form

```bash
curl -X POST http://localhost:9300/forms/{formId}/submissions \
  -H 'Content-Type: application/json' \
  -d '{
    "fields": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "Hello!"
    }
  }'
```

### Run SEO Audit

```bash
curl -X POST http://localhost:9300/websites/{websiteId}/audit/seo \
  -H 'x-role: seo_manager'
```

### Get Analytics

```bash
curl http://localhost:9300/websites/{websiteId}/analytics \
  -H 'x-role: analytics_viewer'
```

## Architecture

```
WebsiteOS
├── Core
│   ├── domain.ts       # All entities and types
│   ├── datastore.ts    # JSON file storage
│   ├── http.ts         # HTTP router and middleware
│   ├── id.ts           # ID generation
│   └── utils.ts        # Utility functions
├── Service
│   └── service.ts      # Business logic
├── Modules
│   └── routes.ts       # API routes
├── Scripts
│   └── seed.ts         # Database seeding
└── Main
    ├── main.ts         # Entry point
    ├── seed-state.ts   # Demo data
    └── docs.ts         # API documentation
```

## Entities

- **Website**: Root entity for a website
- **WebsitePage**: Individual pages with sections and SEO
- **LandingPage**: Marketing landing pages
- **Form**: Lead capture forms
- **FormSubmission**: Form submission data
- **CTA**: Call-to-action elements
- **Domain**: Domain and SSL tracking
- **Deployment**: Deployment history
- **Analytics**: Website analytics data
- **WebsiteEvent**: Event tracking
- **Sitemap**: Generated sitemaps
- **WebsiteAudit**: SEO and audit reports
- **CROCheck**: Conversion rate optimization checks

## Environment Variables

- `PORT`: Server port (default: 9300)
- `WEBSITEOS_DB_FILE`: Database file path (default: data/websiteos.db.json)
- `DEFAULT_TENANT_ID`: Default tenant ID (default: demo-tenant)

## Production Notes

This starter uses JSON file storage for simplicity. For production:

1. Replace `DataStore` with PostgreSQL
2. Implement real authentication
3. Add file upload to cloud storage
4. Connect to other APPNEURAL OS modules
5. Add CDN and caching layers
6. Implement rate limiting and security headers

## Related Systems

- **PlatformOS**: Multi-tenant foundation
- **SecurityOS**: Authentication and authorization
- **AIOS**: AI-powered content generation
- **AnalyticsOS**: Advanced analytics
- **AutomationOS**: Form workflows and automation
- **BrandOS**: Design and branding

## License

MIT
## Related OSs

- platformos
- securityos
