# LocationOS

Location, address, geolocation, routing, zones, and location management operating system for APPNEURAL.

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start

# Or run in dev mode
npm run dev
```

## Configuration

Environment variables:
- `PORT` - Server port (default: 11300)
- `LOCATIONOS_DB_FILE` - Path to JSON database file (default: data/locationos.db.json)
- `DEFAULT_TENANT_ID` - Default tenant ID (default: demo-tenant)

## API Endpoints

### Health & Info
- `GET /health` - Health check
- `GET /docs` - API documentation
- `GET /permissions` - List permissions for current role

### Overview
- `GET /locationos/overview` - Get location metrics overview

### Locations
- `GET /locationos/locations` - List all locations
- `POST /locationos/locations` - Create a new location
- `GET /locationos/locations/:id` - Get location by ID
- `PATCH /locationos/locations/:id` - Update location

### Addresses
- `GET /locationos/addresses` - List all addresses
- `POST /locationos/addresses` - Create a new address
- `GET /locationos/addresses/:id` - Get address by ID
- `POST /locationos/addresses/:id/geocode` - Geocode an address

### Zones
- `GET /locationos/zones` - List all zones
- `POST /locationos/zones` - Create a new zone
- `GET /locationos/zones/:id` - Get zone by ID
- `POST /locationos/zones/check-delivery` - Check delivery availability

### Routes
- `GET /locationos/routes` - List all routes
- `POST /locationos/routes` - Create a new route
- `GET /locationos/routes/:id` - Get route by ID
- `POST /locationos/routes/calculate` - Calculate route distance and duration

### Geofences
- `GET /locationos/geofences` - List all geofences
- `POST /locationos/geofences` - Create a new geofence
- `GET /locationos/geofences/:id` - Get geofence by ID
- `POST /locationos/geofences/:id/check` - Check if coordinates are inside geofence

### Check-ins
- `GET /locationos/checkins` - List all check-ins
- `POST /locationos/checkins` - Create a new check-in

### Field Visits
- `GET /locationos/field-visits` - List all field visits
- `POST /locationos/field-visits` - Create a new field visit
- `GET /locationos/field-visits/:id` - Get field visit by ID
- `PATCH /locationos/field-visits/:id` - Update field visit

### Venues
- `GET /locationos/venues` - List all venues
- `POST /locationos/venues` - Create a new venue
- `GET /locationos/venues/:id` - Get venue by ID

### Branches
- `GET /locationos/branches` - List all branches
- `GET /locationos/branches/:id` - Get branch by ID

### Search
- `GET /locationos/nearby?latitude=X&longitude=Y&radius=Z&type=T` - Find nearby entities

### Audit
- `GET /locationos/audit` - List all audit logs

## Authentication

Use headers to specify authentication:
- `x-role` - User role (owner, admin, location_admin, location_manager, field_agent, viewer)
- `x-tenant-id` - Tenant ID
- `x-user-id` - User ID

Example:
```bash
curl -H "x-role: location_manager" -H "x-tenant-id: demo-tenant" \
  http://localhost:11300/locationos/overview
```

## Core Entities

- **Location** - Physical place with coordinates and metadata
- **Address** - Street address with city, state, country, postal code
- **Zone** - Geographic area for delivery, service, or territory
- **Route** - Planned path with multiple stops
- **Geofence** - Virtual boundary with entry/exit triggers
- **CheckIn** - Location verification record
- **FieldVisit** - Planned or completed client/location visit
- **Venue** - Event or training location with capacity
- **Branch** - Business branch with operating hours
- **Territory** - Geographic region assigned to teams

## Features

- Address management and geocoding
- Delivery zone management with pricing rules
- Geofencing with entry/exit triggers
- Route planning and distance calculation
- Check-in system for attendance
- Field visit tracking
- Venue management
- Branch management
- Territory assignment
- Nearby search
- Audit logging

## Data Storage

Data is stored in JSON files in the `data/` directory by default. The database file will be created automatically on first run.

## License

MIT
## Related OSs

- platformos
- securityos
