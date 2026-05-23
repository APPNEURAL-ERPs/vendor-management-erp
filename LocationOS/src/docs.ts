export function docs() {
  return {
    name: "LocationOS",
    version: "1.0.0",
    description: "Location, address, geolocation, routing, zones, and location management operating system.",
    auth: {
      headers: {
        "x-role": "owner | admin | location_admin | location_manager | field_agent | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      location: "A physical place with coordinates, address, and metadata.",
      address: "Street address with city, state, country, postal code, and optional geocoding.",
      zone: "Geographic area for delivery, service, territory, or geofencing.",
      route: "Planned path with multiple stops and travel calculations.",
      geofence: "Virtual boundary that triggers events on entry/exit.",
      checkin: "Location verification record for attendance or field visits.",
      fieldVisit: "Planned or completed visit to a client or location.",
      venue: "Event or training location with capacity and facilities.",
      branch: "Business branch or office with operating hours.",
      territory: "Geographic region assigned to a team or owner."
    },
    examples: {
      createLocation: {
        method: "POST",
        path: "/locationos/locations",
        headers: { "x-role": "location_manager" },
        body: { name: "New Office", type: "office", city: "Jaipur", state: "Rajasthan", postalCode: "302001" }
      },
      checkDeliveryAvailability: {
        method: "POST",
        path: "/locationos/zones/check-delivery",
        headers: { "x-role": "viewer" },
        body: { zoneId: "zone_udaipur_delivery", latitude: 24.5854, longitude: 73.7125 }
      },
      createCheckin: {
        method: "POST",
        path: "/locationos/checkins",
        headers: { "x-role": "field_agent" },
        body: { userId: "user_123", latitude: 24.5854, longitude: 73.7125, type: "gps", locationId: "loc_udaipur_hq" }
      },
      nearbySearch: {
        method: "GET",
        path: "/locationos/nearby?latitude=24.5854&longitude=73.7125&radius=10&type=location",
        headers: { "x-role": "viewer" }
      }
    }
  };
}
