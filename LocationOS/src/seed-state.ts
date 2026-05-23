import { LocationState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): LocationState {
  const state = emptyState();
  const createdAt = nowIso();

  state.addresses.push(
    {
      id: "addr_udaipur_office",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      addressLine1: "Sector 4",
      addressLine2: "Hiran Magri",
      city: "Udaipur",
      state: "Rajasthan",
      country: "India",
      postalCode: "313001",
      landmark: "Near Sukhadia Circle",
      type: "office",
      status: "verified",
      latitude: 24.5854,
      longitude: 73.7125,
      geocodeConfidence: 0.95,
      geocodeProvider: "demo",
      metadata: {}
    },
    {
      id: "addr_jaipur_office",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      addressLine1: "MI Road",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      postalCode: "302001",
      landmark: "Near Ajmeri Gate",
      type: "branch",
      status: "verified",
      latitude: 26.9124,
      longitude: 75.7873,
      geocodeConfidence: 0.92,
      geocodeProvider: "demo",
      metadata: {}
    },
    {
      id: "addr_client_techcorp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      addressLine1: "Industrial Area",
      addressLine2: "RIICO",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      postalCode: "303007",
      landmark: "Near Sitapura Industrial Area",
      type: "client",
      status: "verified",
      latitude: 26.8490,
      longitude: 75.7950,
      geocodeConfidence: 0.88,
      geocodeProvider: "demo",
      metadata: {}
    },
    {
      id: "addr_restaurant_delivery_zone",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      addressLine1: "Fatehsagar",
      city: "Udaipur",
      state: "Rajasthan",
      country: "India",
      postalCode: "313004",
      type: "other",
      status: "unverified",
      latitude: 24.5911,
      longitude: 73.6815,
      geocodeConfidence: 0.75,
      geocodeProvider: "demo",
      metadata: {}
    }
  );

  state.locations.push(
    {
      id: "loc_udaipur_hq",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "APPNEURAL Udaipur HQ",
      description: "Main office in Udaipur",
      type: "office",
      status: "active",
      addressId: "addr_udaipur_office",
      phone: "+91-294-2421234",
      email: "udaipur@appneural.com",
      capacity: 50,
      facilities: ["WiFi", "Parking", "Conference Room", "Cafeteria"],
      tags: ["headquarters", "udaipur", "main"],
      metadata: {}
    },
    {
      id: "loc_jaipur_branch",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "APPNEURAL Jaipur Branch",
      description: "Regional office in Jaipur",
      type: "office",
      status: "active",
      addressId: "addr_jaipur_office",
      phone: "+91-141-2367890",
      email: "jaipur@appneural.com",
      capacity: 30,
      facilities: ["WiFi", "Parking", "Meeting Room"],
      tags: ["branch", "jaipur", "regional"],
      metadata: {}
    }
  );

  state.branches.push(
    {
      id: "branch_udaipur",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Udaipur Branch",
      description: "APPNEURAL main branch",
      code: "UDA001",
      addressId: "addr_udaipur_office",
      phone: "+91-294-2421234",
      email: "udaipur@appneural.com",
      managerId: "user_manager_udaipur",
      status: "active",
      openingHours: {
        timezone: "Asia/Kolkata",
        monday: { open: "09:00", close: "18:00" },
        tuesday: { open: "09:00", close: "18:00" },
        wednesday: { open: "09:00", close: "18:00" },
        thursday: { open: "09:00", close: "18:00" },
        friday: { open: "09:00", close: "18:00" },
        saturday: { open: "10:00", close: "14:00" },
        sunday: { open: "00:00", close: "00:00", isClosed: true }
      },
      services: ["consulting", "training", "implementation"],
      type: "office",
      tags: ["main", "udaipur"],
      metadata: {}
    },
    {
      id: "branch_jaipur",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Jaipur Branch",
      description: "APPNEURAL regional branch",
      code: "JAI001",
      addressId: "addr_jaipur_office",
      phone: "+91-141-2367890",
      email: "jaipur@appneural.com",
      managerId: "user_manager_jaipur",
      status: "active",
      openingHours: {
        timezone: "Asia/Kolkata",
        monday: { open: "10:00", close: "19:00" },
        tuesday: { open: "10:00", close: "19:00" },
        wednesday: { open: "10:00", close: "19:00" },
        thursday: { open: "10:00", close: "19:00" },
        friday: { open: "10:00", close: "19:00" },
        saturday: { open: "10:00", close: "17:00" },
        sunday: { open: "00:00", close: "00:00", isClosed: true }
      },
      services: ["sales", "support"],
      type: "office",
      tags: ["regional", "jaipur"],
      metadata: {}
    }
  );

  state.zones.push(
    {
      id: "zone_udaipur_delivery",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Udaipur Delivery Zone",
      description: "Free and paid delivery zones within Udaipur",
      type: "delivery",
      status: "active",
      center: { latitude: 24.5854, longitude: 73.7125 },
      radius: 15,
      pricingRules: [
        { minDistance: 0, maxDistance: 3, baseFee: 0, freeDeliveryThreshold: 500 },
        { minDistance: 3, maxDistance: 7, baseFee: 50, perKmFee: 10 },
        { minDistance: 7, maxDistance: 15, baseFee: 100, perKmFee: 15 }
      ],
      availabilityRules: [
        { dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: "09:00", endTime: "22:00", isAvailable: true }
      ],
      tags: ["udaipur", "delivery", "food", "products"],
      metadata: {}
    },
    {
      id: "zone_rajasthan_sales",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Rajasthan Sales Territory",
      description: "Sales coverage for entire Rajasthan state",
      type: "territory",
      status: "active",
      pricingRules: [],
      availabilityRules: [],
      tags: ["rajasthan", "sales", "territory"],
      metadata: {}
    },
    {
      id: "zone_udaipur_service",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Udaipur Service Area",
      description: "On-site service coverage area",
      type: "service",
      status: "active",
      center: { latitude: 24.5854, longitude: 73.7125 },
      radius: 20,
      pricingRules: [],
      availabilityRules: [
        { dayOfWeek: [1, 2, 3, 4, 5], startTime: "10:00", endTime: "18:00", isAvailable: true }
      ],
      tags: ["udaipur", "service", "onsite"],
      metadata: {}
    }
  );

  state.geofences.push(
    {
      id: "geofence_udaipur_office",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Udaipur Office Geofence",
      description: "Attendance geofence for Udaipur office",
      type: "circular",
      status: "active",
      center: { latitude: 24.5854, longitude: 73.7125 },
      radius: 100,
      triggers: [
        { type: "entry", action: "checkin.verified", notifyRoles: ["location_manager"] },
        { type: "exit", action: "checkout.completed" }
      ],
      metadata: {}
    },
    {
      id: "geofence_techcorp_client",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "TechCorp Client Site",
      description: "Geofence for client visits at TechCorp",
      type: "circular",
      status: "active",
      center: { latitude: 26.8490, longitude: 75.7950 },
      radius: 150,
      triggers: [
        { type: "entry", action: "fieldvisit.started" },
        { type: "exit", action: "fieldvisit.completed" }
      ],
      metadata: {}
    }
  );

  state.venues.push(
    {
      id: "venue_udaipur_training",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Udaipur Training Center",
      description: "Main training venue for workshops",
      addressId: "addr_udaipur_office",
      capacity: 30,
      facilities: ["Projector", "Whiteboard", "WiFi", "AC", "Parking"],
      contactPerson: "Training Coordinator",
      contactPhone: "+91-294-2421234",
      contactEmail: "training@appneural.com",
      parkingInfo: "Available in building basement",
      mapUrl: "https://maps.google.com/?q=24.5854,73.7125",
      directionsUrl: "https://maps.google.com/dir/?api=1&destination=24.5854,73.7125",
      geofenceRadius: 100,
      status: "active",
      tags: ["training", "workshop", "udaipur"],
      metadata: {}
    }
  );

  state.territories.push(
    {
      id: "terr_udaipur",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Udaipur Territory",
      description: "Sales and service territory for Udaipur region",
      type: "sales",
      status: "active",
      cities: ["Udaipur", "Bhilwara", "Chittorgarh", "Rajsamand"],
      states: ["Rajasthan"],
      ownerId: "user_owner_udaipur",
      teamIds: ["team_udaipur"],
      tags: ["udaipur", "south_rajasthan", "sales"],
      metadata: {}
    },
    {
      id: "terr_jaipur",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Jaipur Territory",
      description: "Sales and service territory for Jaipur region",
      type: "sales",
      status: "active",
      cities: ["Jaipur", "Ajmer", "Alwar", "Bharatpur"],
      states: ["Rajasthan"],
      ownerId: "user_owner_jaipur",
      teamIds: ["team_jaipur"],
      tags: ["jaipur", "east_rajasthan", "sales"],
      metadata: {}
    }
  );

  state.routes.push(
    {
      id: "route_field_visit_jaipur",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Jaipur Field Visit Route",
      description: "Daily route for client visits in Jaipur",
      status: "planned",
      stops: [
        {
          order: 1,
          locationId: "loc_jaipur_branch",
          addressId: "addr_jaipur_office",
          name: "Jaipur Branch",
          address: "MI Road, Jaipur",
          status: "pending"
        },
        {
          order: 2,
          addressId: "addr_client_techcorp",
          name: "TechCorp Industries",
          address: "RIICO Industrial Area, Jaipur",
          status: "pending"
        }
      ],
      totalDistance: 25.5,
      totalDuration: 90,
      travelMode: "car",
      tags: ["field_visit", "jaipur", "daily"],
      metadata: {}
    }
  );

  state.checkins.push(
    {
      id: "checkin_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      userId: "user_field_agent",
      locationId: "loc_udaipur_hq",
      latitude: 24.5854,
      longitude: 73.7125,
      accuracy: 10,
      type: "gps",
      status: "verified",
      device: "Android-12",
      metadata: {}
    }
  );

  state.fieldVisits.push(
    {
      id: "fieldvisit_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "TechCorp Client Visit",
      description: "Quarterly review meeting",
      type: "client",
      status: "scheduled",
      userId: "user_sales_rep",
      clientId: "client_techcorp",
      locationId: "loc_jaipur_branch",
      addressId: "addr_client_techcorp",
      scheduledStart: new Date(Date.now() + 86400000).toISOString(),
      scheduledEnd: new Date(Date.now() + 86400000 + 7200000).toISOString(),
      outcome: undefined,
      notes: "Quarterly business review",
      tags: ["client_visit", "jaipur", "qbr"],
      metadata: {}
    }
  );

  state.events.push({
    id: "event_locationos_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "locationos.seeded",
    source: "LocationOS",
    data: { message: "LocationOS demo data seeded" }
  });

  return state;
}
