# ResourceOS

ResourceOS is a resource management operating system for APPNEURAL that handles resource allocation, capacity planning, utilization tracking, and resource booking.

## Quick Start

```bash
cd ResourceOS
npm install
npm run dev
```

The server will start on port **11800**.

## API Endpoints

### Health Check
```bash
GET http://localhost:11800/health
```

### API Documentation
```bash
GET http://localhost:11800/docs
```

### Resources
```bash
# Create a resource
POST http://localhost:11800/resources
{
  "name": "Node.js Developer",
  "category": "people",
  "type": "Developer",
  "skills": ["Node.js", "TypeScript"],
  "maxHoursPerWeek": 40,
  "hourlyRate": 50
}

# List all resources
GET http://localhost:11800/resources

# Get a specific resource
GET http://localhost:11800/resources/:id

# Search resources
POST http://localhost:11800/resources/search
{
  "skills": ["Node.js"],
  "category": "people"
}
```

### Allocations
```bash
# Create allocation
POST http://localhost:11800/allocations
{
  "resourceId": "res_xxx",
  "allocationType": "project",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "allocationPercent": 50
}

# List allocations
GET http://localhost:11800/allocations
```

### Bookings
```bash
# Book a room
POST http://localhost:11800/bookings
{
  "resourceId": "res_yyy",
  "bookingType": "room",
  "startDate": "2024-01-15",
  "endDate": "2024-01-15",
  "startTime": "10:00",
  "endTime": "12:00",
  "attendees": 10
}

# List bookings
GET http://localhost:11800/bookings
```

### Utilization
```bash
# Get utilization
GET http://localhost:11800/resources/:id/utilization

# Calculate utilization
POST http://localhost:11800/resources/:id/utilization/calculate
```

### Analytics
```bash
GET http://localhost:11800/analytics
```

## Authentication

ResourceOS uses header-based authentication:

- `x-tenant-id`: Tenant identifier (defaults to 'demo-tenant')
- `x-user-id`: User identifier
- `x-role`: User role (viewer, resource_manager, resource_admin, resource_analyst, admin, owner, auditor)

## Resource Categories

- **people**: Human resources (developers, designers, managers)
- **equipment**: Physical equipment (laptops, projectors)
- **rooms**: Meeting rooms, training rooms
- **vehicles**: Cars, bikes
- **licenses**: Software licenses
- **cloud**: Cloud infrastructure
- **digital**: Digital assets
- **training**: Training resources
- **support**: Support capacity
- **sales**: Sales resources

## Demo Data

The system includes demo data with:
- 3 developers (Node.js, React, AI Engineer)
- 2 meeting rooms
- 2 equipment items (projector, laptops)
- 1 software license (Figma)
- 1 cloud resource (AWS)
- 1 vehicle (Honda City)
- Active allocations and bookings

## Commands

```bash
npm run build    # Compile TypeScript
npm run start   # Start production server
npm run dev     # Start development server
npm run seed    # Load demo data
```

## Architecture

- **src/domain.ts**: Core entity definitions
- **src/service.ts**: Business logic
- **src/core/datastore.ts**: JSON file storage
- **src/core/utils.ts**: HTTP router and utilities
- **src/main.ts**: Entry point and API routes
- **src/seed-state.ts**: Demo data
- **src/docs.ts**: API documentation

## Features

✅ Resource creation and management  
✅ Resource allocation to projects/tasks  
✅ Resource booking (rooms, equipment, vehicles)  
✅ Conflict detection (double booking, over-allocation)  
✅ Utilization tracking and calculation  
✅ Resource pools and grouping  
✅ Resource requests and maintenance  
✅ Skill management  
✅ Analytics and reporting  
✅ Audit logging  
✅ Event publishing  
✅ Multi-tenant support  
✅ Role-based access control
## Related OSs

- platformos
- securityos
