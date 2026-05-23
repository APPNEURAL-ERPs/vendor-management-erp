export const API_DOCS = {
  title: "ResourceOS API Documentation",
  version: "1.0.0",
  description: "Resource allocation, capacity planning, utilization tracking, and resource booking",
  baseUrl: "http://localhost:11800",

  authentication: {
    description: "ResourceOS uses header-based authentication",
    headers: [
      { name: "x-tenant-id", required: false, description: "Tenant identifier (defaults to 'demo-tenant')" },
      { name: "x-user-id", required: false, description: "User identifier (defaults to role-based user)" },
      { name: "x-role", required: false, description: "User role (defaults to 'viewer'). Options: viewer, resource_manager, resource_admin, resource_analyst, admin, owner, auditor" },
    ],
  },

  endpoints: {
    health: {
      method: "GET",
      path: "/health",
      description: "Health check endpoint",
      permission: null,
      response: {
        status: "ok | error",
        service: "ResourceOS",
        version: "1.0.0",
        timestamp: "ISO date string",
      },
    },

    docs: {
      method: "GET",
      path: "/docs",
      description: "API documentation",
      permission: null,
    },

    resources: {
      create: {
        method: "POST",
        path: "/resources",
        description: "Create a new resource",
        permission: "resource.write",
        body: {
          name: { type: "string", required: true, description: "Resource name" },
          category: { type: "string", required: true, description: "Resource category (people, equipment, rooms, vehicles, licenses, cloud, digital, training, support, sales)" },
          type: { type: "string", required: true, description: "Resource type" },
          description: { type: "string", required: false, description: "Resource description" },
          ownerId: { type: "string", required: false, description: "Owner user ID" },
          skills: { type: "array", required: false, description: "List of skills" },
          maxHoursPerDay: { type: "number", required: false, description: "Maximum hours per day" },
          maxHoursPerWeek: { type: "number", required: false, description: "Maximum hours per week" },
          maxHoursPerMonth: { type: "number", required: false, description: "Maximum hours per month" },
          maxUnits: { type: "number", required: false, description: "Maximum units available" },
          hourlyRate: { type: "number", required: false, description: "Hourly cost rate" },
          dailyRate: { type: "number", required: false, description: "Daily cost rate" },
          monthlyRate: { type: "number", required: false, description: "Monthly cost rate" },
          currency: { type: "string", required: false, description: "Currency code (default: USD)" },
          billable: { type: "boolean", required: false, description: "Whether resource is billable" },
          location: { type: "string", required: false, description: "Resource location" },
          tags: { type: "array", required: false, description: "Resource tags" },
          metadata: { type: "object", required: false, description: "Additional metadata" },
        },
      },

      list: {
        method: "GET",
        path: "/resources",
        description: "List all resources",
        permission: "resource.read",
        query: {
          category: { type: "string", required: false, description: "Filter by category" },
          status: { type: "string", required: false, description: "Filter by status" },
          skill: { type: "string", required: false, description: "Filter by skill" },
          search: { type: "string", required: false, description: "Search in name, type, description" },
        },
      },

      get: {
        method: "GET",
        path: "/resources/:id",
        description: "Get a specific resource",
        permission: "resource.read",
      },

      update: {
        method: "PATCH",
        path: "/resources/:id",
        description: "Update a resource",
        permission: "resource.write",
        body: {
          status: { type: "string", required: false },
          description: { type: "string", required: false },
          skills: { type: "array", required: false },
          tags: { type: "array", required: false },
          metadata: { type: "object", required: false },
        },
      },

      delete: {
        method: "DELETE",
        path: "/resources/:id",
        description: "Delete a resource and all related allocations/bookings",
        permission: "resource.admin",
      },

      search: {
        method: "POST",
        path: "/resources/search",
        description: "Advanced resource search",
        permission: "resource.read",
        body: {
          category: { type: "string", required: false },
          skills: { type: "array", required: false },
          availableFrom: { type: "string", required: false },
          availableTo: { type: "string", required: false },
          minUtilization: { type: "number", required: false },
          maxUtilization: { type: "number", required: false },
          search: { type: "string", required: false },
        },
      },

      availability: {
        method: "GET",
        path: "/resources/:id/availability",
        description: "Get resource availability for a date range",
        permission: "resource.read",
        query: {
          startDate: { type: "string", required: false, description: "Start date (ISO)" },
          endDate: { type: "string", required: false, description: "End date (ISO)" },
        },
      },

      utilization: {
        method: "GET",
        path: "/resources/:id/utilization",
        description: "Get resource utilization metrics",
        permission: "resource.read",
        query: {
          periodStart: { type: "string", required: false },
          periodEnd: { type: "string", required: false },
        },
      },

      calculateUtilization: {
        method: "POST",
        path: "/resources/:id/utilization/calculate",
        description: "Calculate resource utilization for a period",
        permission: "resource.read",
        body: {
          periodStart: { type: "string", required: false },
          periodEnd: { type: "string", required: false },
        },
      },
    },

    allocations: {
      create: {
        method: "POST",
        path: "/allocations",
        description: "Create a new resource allocation",
        permission: "resource.allocate",
        body: {
          resourceId: { type: "string", required: true },
          allocationType: { type: "string", required: true, description: "project, task, shift, temporary, permanent" },
          projectId: { type: "string", required: false },
          taskId: { type: "string", required: false },
          startDate: { type: "string", required: true, description: "ISO date" },
          endDate: { type: "string", required: true, description: "ISO date" },
          allocationPercent: { type: "number", required: true, description: "0-100" },
          hoursPerWeek: { type: "number", required: false },
          status: { type: "string", required: false, description: "requested, approved, active" },
          notes: { type: "string", required: false },
        },
      },

      list: {
        method: "GET",
        path: "/allocations",
        description: "List all allocations",
        permission: "resource.read",
      },

      get: {
        method: "GET",
        path: "/allocations/:id",
        description: "Get a specific allocation",
        permission: "resource.read",
      },
    },

    bookings: {
      create: {
        method: "POST",
        path: "/bookings",
        description: "Create a new resource booking",
        permission: "resource.book",
        body: {
          resourceId: { type: "string", required: true },
          bookingType: { type: "string", required: true, description: "room, equipment, vehicle, trainer, consultant, device, license" },
          startDate: { type: "string", required: true, description: "ISO date" },
          endDate: { type: "string", required: true, description: "ISO date" },
          startTime: { type: "string", required: false },
          endTime: { type: "string", required: false },
          attendees: { type: "number", required: false },
          purpose: { type: "string", required: false },
          status: { type: "string", required: false, description: "requested, confirmed" },
          notes: { type: "string", required: false },
        },
      },

      list: {
        method: "GET",
        path: "/bookings",
        description: "List all bookings",
        permission: "resource.read",
      },

      get: {
        method: "GET",
        path: "/bookings/:id",
        description: "Get a specific booking",
        permission: "resource.read",
      },
    },

    skills: {
      create: {
        method: "POST",
        path: "/skills",
        description: "Add a skill to a resource",
        permission: "resource.write",
        body: {
          resourceId: { type: "string", required: true },
          skillName: { type: "string", required: true },
          proficiencyLevel: { type: "string", required: true, description: "beginner, intermediate, advanced, expert" },
          yearsOfExperience: { type: "number", required: false },
          certifications: { type: "array", required: false },
          verified: { type: "boolean", required: false },
        },
      },

      list: {
        method: "GET",
        path: "/skills",
        description: "List all skills",
        permission: "resource.read",
        query: {
          resourceId: { type: "string", required: false },
        },
      },
    },

    pools: {
      create: {
        method: "POST",
        path: "/pools",
        description: "Create a resource pool",
        permission: "resource.write",
        body: {
          name: { type: "string", required: true },
          description: { type: "string", required: false },
          poolType: { type: "string", required: true, description: "skill, team, department, location, role, equipment, license" },
          resourceIds: { type: "array", required: true },
          ownerId: { type: "string", required: false },
        },
      },

      list: {
        method: "GET",
        path: "/pools",
        description: "List all resource pools",
        permission: "resource.read",
      },
    },

    requests: {
      create: {
        method: "POST",
        path: "/requests",
        description: "Create a resource request",
        permission: "resource.write",
        body: {
          requestType: { type: "string", required: true, description: "Resource category" },
          resourceName: { type: "string", required: false },
          skills: { type: "array", required: false },
          quantity: { type: "number", required: true },
          startDate: { type: "string", required: true },
          endDate: { type: "string", required: true },
          allocationPercent: { type: "number", required: false },
          purpose: { type: "string", required: false },
          projectId: { type: "string", required: false },
        },
      },

      list: {
        method: "GET",
        path: "/requests",
        description: "List all resource requests",
        permission: "resource.read",
      },
    },

    maintenance: {
      create: {
        method: "POST",
        path: "/maintenance",
        description: "Schedule resource maintenance",
        permission: "resource.write",
        body: {
          resourceId: { type: "string", required: true },
          maintenanceType: { type: "string", required: true, description: "preventive, corrective, predictive" },
          scheduledDate: { type: "string", required: true },
          description: { type: "string", required: true },
          cost: { type: "number", required: false },
          performedBy: { type: "string", required: false },
        },
      },

      list: {
        method: "GET",
        path: "/maintenance",
        description: "List all maintenance records",
        permission: "resource.read",
        query: {
          resourceId: { type: "string", required: false },
        },
      },
    },

    conflicts: {
      list: {
        method: "GET",
        path: "/conflicts",
        description: "List all detected conflicts",
        permission: "resource.read",
      },

      detect: {
        method: "POST",
        path: "/conflicts/detect",
        description: "Detect and report booking/allocation conflicts",
        permission: "resource.read",
      },
    },

    analytics: {
      method: "GET",
      path: "/analytics",
      description: "Get resource analytics and metrics",
      permission: "resource.read",
    },

    events: {
      method: "GET",
      path: "/events",
      description: "List recent resource events",
      permission: "resource.read",
      query: {
        limit: { type: "number", required: false, default: 100 },
      },
    },

    audit: {
      method: "GET",
      path: "/audit",
      description: "List audit logs",
      permission: "resource.audit.read",
      query: {
        limit: { type: "number", required: false, default: 100 },
      },
    },
  },

  exampleUsage: {
    createResource: {
      title: "Create a new developer resource",
      request: {
        method: "POST",
        path: "/resources",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "demo-tenant",
          "x-user-id": "admin-user",
          "x-role": "resource_admin",
        },
        body: {
          name: "Senior React Developer",
          category: "people",
          type: "Developer",
          description: "Experienced React developer",
          skills: ["React", "TypeScript", "Next.js"],
          maxHoursPerWeek: 40,
          hourlyRate: 55,
          currency: "USD",
          location: "Remote",
          tags: ["frontend", "react", "senior"],
        },
      },
    },

    allocateResource: {
      title: "Allocate a resource to a project",
      request: {
        method: "POST",
        path: "/allocations",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "demo-tenant",
          "x-role": "resource_manager",
        },
        body: {
          resourceId: "res_demo_001",
          allocationType: "project",
          projectId: "proj_website_redesign",
          startDate: "2024-01-01",
          endDate: "2024-03-31",
          allocationPercent: 50,
          hoursPerWeek: 20,
          status: "approved",
        },
      },
    },

    bookRoom: {
      title: "Book a meeting room",
      request: {
        method: "POST",
        path: "/bookings",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "demo-tenant",
        },
        body: {
          resourceId: "res_demo_004",
          bookingType: "room",
          startDate: "2024-01-15",
          endDate: "2024-01-15",
          startTime: "10:00",
          endTime: "12:00",
          attendees: 10,
          purpose: "Team meeting",
          status: "confirmed",
        },
      },
    },

    checkUtilization: {
      title: "Check resource utilization",
      request: {
        method: "GET",
        path: "/resources/res_demo_001/utilization?periodStart=2024-01-01&periodEnd=2024-01-31",
      },
    },
  },

  resourceCategories: [
    "people - Human resources like developers, designers, managers",
    "equipment - Physical equipment like laptops, projectors",
    "rooms - Meeting rooms, training rooms, conference halls",
    "vehicles - Cars, bikes for field operations",
    "licenses - Software licenses like Figma, GitHub, AWS",
    "cloud - Cloud infrastructure like AWS, Azure resources",
    "digital - Digital assets like templates, code libraries",
    "training - Training materials and resources",
    "support - Support agent capacity",
    "sales - Sales team and resources",
  ],

  resourceStatuses: [
    "available - Resource is available for allocation/booking",
    "allocated - Resource is allocated to projects/tasks",
    "booked - Resource is booked for specific time slots",
    "in_use - Resource is currently in use",
    "unavailable - Resource is not available",
    "maintenance - Resource is under maintenance",
    "retired - Resource has been retired",
    "archived - Resource has been archived",
  ],

  bookingStatuses: [
    "requested - Booking has been requested",
    "confirmed - Booking has been confirmed",
    "rejected - Booking has been rejected",
    "cancelled - Booking has been cancelled",
    "completed - Booking has been completed",
    "no_show - Booked but not used",
    "expired - Booking has expired",
  ],

  allocationStatuses: [
    "requested - Allocation has been requested",
    "approved - Allocation has been approved",
    "active - Allocation is currently active",
    "completed - Allocation has been completed",
    "cancelled - Allocation has been cancelled",
  ],
};

export function getApiDocs(): typeof API_DOCS {
  return API_DOCS;
}
