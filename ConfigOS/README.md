# ConfigOS

**Runtime configuration, tenant settings, feature flags, environment config, and OS-level settings management for APPNEURAL ecosystem.**

## Overview

ConfigOS is the configuration control engine that manages:
- Global settings
- Tenant settings
- Environment configs
- Module configs
- Feature flags
- Runtime behavior
- Schema validation
- Rollouts
- Rollback
- Audits
- Config governance

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the server
npm start

# Or run in development mode
npm run dev
```

The server will start on `http://localhost:5500`

## API Endpoints

### Health & Documentation
- `GET /health` - Health check
- `GET /docs` - API documentation

### Overview
- `GET /configos/overview` - Get configuration overview

### Configurations
- `GET /configos/configs` - List all configs
- `GET /configos/configs/:id` - Get config by ID
- `POST /configos/configs` - Create new config
- `PATCH /configos/configs/:id` - Update config
- `DELETE /configos/configs/:id` - Delete config
- `GET /configos/configs/resolve?key=<key>` - Resolve config value with precedence
- `POST /configos/configs/:id/rollback` - Rollback config to previous version

### Feature Flags
- `GET /configos/feature-flags` - List feature flags
- `GET /configos/feature-flags/:id` - Get feature flag by ID
- `POST /configos/feature-flags` - Create feature flag
- `PATCH /configos/feature-flags/:id` - Update feature flag
- `POST /configos/feature-flags/:id/toggle` - Toggle feature flag
- `GET /configos/feature-flags/check/:key` - Check if feature flag is enabled

### Environment Configs
- `GET /configos/environments` - List environment configs
- `GET /configos/environments/:id` - Get environment config by ID
- `POST /configos/environments` - Create environment config
- `PATCH /configos/environments/:id` - Update environment config

### Tenant Settings
- `GET /configos/tenants` - List tenant settings
- `GET /configos/tenants/:id` - Get tenant setting by ID
- `POST /configos/tenants` - Create tenant setting
- `PATCH /configos/tenants/:id` - Update tenant setting

### Runtime Overrides
- `GET /configos/runtime-overrides` - List runtime overrides
- `GET /configos/runtime-overrides/:id` - Get runtime override by ID
- `POST /configos/runtime-overrides` - Create runtime override
- `PATCH /configos/runtime-overrides/:id` - Update runtime override

## Authentication

All API endpoints support the following headers:
- `x-role` - User role (owner, admin, config_admin, config_manager, config_viewer, tenant_admin, auditor)
- `x-tenant-id` - Tenant ID (defaults to "demo-tenant")
- `x-user-id` - User ID (defaults to "{role}-user")

## Environment Variables

- `PORT` - Server port (default: 5500)
- `CONFIGOS_DB_FILE` - Path to JSON database file (default: "data/configos.db.json")
- `DEFAULT_TENANT_ID` - Default tenant ID (default: "demo-tenant")

## Config Resolution Precedence

When resolving config values, ConfigOS follows this precedence order:

1. **Runtime Override** - Highest priority, temporary overrides
2. **Tenant Setting** - Tenant-specific settings with override flag
3. **Environment Config** - Environment-specific configurations
4. **Global Config** - Default platform-wide configurations

## Feature Flag Targeting

Feature flags support multiple targeting strategies:
- **Percentage Rollout** - Gradual rollout by percentage
- **Tenant Targeting** - Enable for specific tenants
- **Role Targeting** - Enable for specific user roles
- **Plan Targeting** - Enable for specific subscription plans

## Core Entities

- **Config** - Key-value configurations with versioning
- **FeatureFlag** - Feature toggles with rollout strategies
- **EnvironmentConfig** - Environment-specific configurations
- **TenantSetting** - Tenant-specific settings
- **RuntimeOverride** - Temporary runtime overrides

## Development

```bash
# Reset database with seed data
npm run reset

# Run tests
npm test

# Seed database
npm run seed
```

## Project Structure

```
ConfigOS/
├── manifest.json          # OS manifest
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
├── src/
│   ├── main.ts           # Entry point
│   ├── domain.ts         # Domain entities
│   ├── service.ts        # Business logic
│   ├── routes.ts         # HTTP routes
│   ├── docs.ts           # API documentation
│   ├── seed-state.ts     # Demo data
│   └── core/
│       ├── datastore.ts  # Data persistence
│       ├── http.ts       # HTTP router
│       ├── id.ts         # ID generation
│       └── utils.ts      # Utilities
├── dist/                 # Compiled output
└── data/                 # JSON database files
```

## Use Cases

1. **Centralized Configuration Management**
   - Manage all APPNEURAL module configurations in one place
   - Version control for config changes
   - Environment-specific configurations

2. **Feature Flag Management**
   - Safely enable/disable features
   - Gradual rollout strategies
   - Kill switches for emergencies

3. **Multi-Tenant Settings**
   - Per-tenant customization
   - Branding and theming
   - Feature enablement per tenant

4. **Runtime Behavior Control**
   - Change behavior without code deployment
   - Temporary overrides for testing
   - Dynamic configuration updates

## License

MIT
## Related OSs

- platformos
- securityos
