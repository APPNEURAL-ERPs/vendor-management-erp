import { DataStore } from "./core/datastore";
import {
  Address,
  AuditLog,
  Branch,
  CheckIn,
  FieldVisit,
  GeoPoint,
  Geofence,
  Location,
  LocationOverview,
  RequestActor,
  Route,
  Venue,
  Zone
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { calculateDistance, estimateETA, newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

export class LocationService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "LocationOS service is ready";
  }

  overview(actor: RequestActor): LocationOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    return {
      locations: state.locations.filter((item) => item.tenantId === tenant).length,
      addresses: state.addresses.filter((item) => item.tenantId === tenant).length,
      zones: state.zones.filter((item) => item.tenantId === tenant).length,
      routes: state.routes.filter((item) => item.tenantId === tenant).length,
      geofences: state.geofences.filter((item) => item.tenantId === tenant).length,
      checkins: state.checkins.filter((item) => item.tenantId === tenant).length,
      fieldVisits: state.fieldVisits.filter((item) => item.tenantId === tenant).length,
      venues: state.venues.filter((item) => item.tenantId === tenant).length,
      territories: state.territories.filter((item) => item.tenantId === tenant).length,
      branches: state.branches.filter((item) => item.tenantId === tenant).length,
      verifiedAddresses: state.addresses.filter((item) => item.tenantId === tenant && item.status === "verified").length,
      activeZones: state.zones.filter((item) => item.tenantId === tenant && item.status === "active").length
    };
  }

  listLocations(actor: RequestActor, query?: URLSearchParams): Location[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().locations.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (type && item.type !== type) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getLocation(id: string, actor: RequestActor): Location {
    const location = this.store.getState().locations.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!location) notFound("Location not found");
    return clone(location);
  }

  createLocation(input: unknown, actor: RequestActor): Location {
    const body = ensureObject(input, "location");
    const state = this.store.getState();
    const name = ensureString(body.name, "location.name");
    const location: Location = {
      id: newId("loc"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name,
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "other") as Location["type"],
      status: String(body.status ?? "active") as Location["status"],
      addressId: body.addressId ? String(body.addressId) : undefined,
      geolocationId: body.geolocationId ? String(body.geolocationId) : undefined,
      coordinates: body.coordinates ? ensureObject(body.coordinates, "location.coordinates") as GeoPoint : undefined,
      phone: body.phone ? String(body.phone) : undefined,
      email: body.email ? String(body.email) : undefined,
      website: body.website ? String(body.website) : undefined,
      capacity: body.capacity ? ensureNumber(body.capacity, "location.capacity") : undefined,
      facilities: ensureArray<string>(body.facilities, "location.facilities"),
      mapUrl: body.mapUrl ? String(body.mapUrl) : undefined,
      tags: ensureArray<string>(body.tags, "location.tags"),
      metadata: optionalObject(body.metadata)
    };
    state.locations.push(location);
    this.store.save();
    this.store.audit(actor, "location.create", "location", location.id, undefined, location);
    return clone(location);
  }

  updateLocation(id: string, input: unknown, actor: RequestActor): Location {
    const body = ensureObject(input, "location");
    const state = this.store.getState();
    const location = state.locations.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!location) notFound("Location not found");
    const before = clone(location);
    if (body.name !== undefined) location.name = ensureString(body.name, "location.name");
    if (body.description !== undefined) location.description = body.description ? String(body.description) : undefined;
    if (body.type !== undefined) location.type = String(body.type) as Location["type"];
    if (body.status !== undefined) location.status = String(body.status) as Location["status"];
    if (body.addressId !== undefined) location.addressId = body.addressId ? String(body.addressId) : undefined;
    if (body.coordinates !== undefined) location.coordinates = body.coordinates ? ensureObject(body.coordinates, "location.coordinates") as GeoPoint : undefined;
    if (body.phone !== undefined) location.phone = body.phone ? String(body.phone) : undefined;
    if (body.email !== undefined) location.email = body.email ? String(body.email) : undefined;
    if (body.capacity !== undefined) location.capacity = body.capacity ? ensureNumber(body.capacity, "location.capacity") : undefined;
    if (body.facilities !== undefined) location.facilities = ensureArray<string>(body.facilities, "location.facilities");
    if (body.tags !== undefined) location.tags = ensureArray<string>(body.tags, "location.tags");
    if (body.metadata !== undefined) location.metadata = optionalObject(body.metadata);
    location.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "location.update", "location", location.id, before, clone(location));
    return clone(location);
  }

  listAddresses(actor: RequestActor, query?: URLSearchParams): Address[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const city = pickQuery(query, "city");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().addresses.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.addressLine1} ${item.addressLine2 ?? ""} ${item.city} ${item.state}`.toLowerCase().includes(search)) return false;
      if (city && item.city.toLowerCase() !== city.toLowerCase()) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getAddress(id: string, actor: RequestActor): Address {
    const address = this.store.getState().addresses.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!address) notFound("Address not found");
    return clone(address);
  }

  createAddress(input: unknown, actor: RequestActor): Address {
    const body = ensureObject(input, "address");
    const state = this.store.getState();
    const address: Address = {
      id: newId("addr"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      addressLine1: ensureString(body.addressLine1, "address.addressLine1"),
      addressLine2: body.addressLine2 ? String(body.addressLine2) : undefined,
      city: ensureString(body.city, "address.city"),
      state: ensureString(body.state, "address.state"),
      country: ensureString(body.country, "address.country", "India"),
      postalCode: ensureString(body.postalCode, "address.postalCode"),
      landmark: body.landmark ? String(body.landmark) : undefined,
      type: String(body.type ?? "other") as Address["type"],
      status: "unverified",
      latitude: body.latitude ? ensureNumber(body.latitude, "address.latitude") : undefined,
      longitude: body.longitude ? ensureNumber(body.longitude, "address.longitude") : undefined,
      geocodeConfidence: body.geocodeConfidence ? ensureNumber(body.geocodeConfidence, "address.geocodeConfidence") : undefined,
      geocodeProvider: body.geocodeProvider ? String(body.geocodeProvider) : undefined,
      metadata: optionalObject(body.metadata)
    };
    state.addresses.push(address);
    this.store.save();
    this.store.audit(actor, "address.create", "address", address.id, undefined, address);
    return clone(address);
  }

  geocodeAddress(id: string, actor: RequestActor): Address {
    const state = this.store.getState();
    const address = state.addresses.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!address) notFound("Address not found");
    const before = clone(address);
    if (address.latitude && address.longitude) {
      address.geocodeConfidence = 0.85;
      address.geocodeProvider = "demo_geocoder";
    } else {
      address.status = "failed";
    }
    address.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "address.geocode", "address", address.id, before, clone(address));
    return clone(address);
  }

  listZones(actor: RequestActor, query?: URLSearchParams): Zone[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().zones.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (type && item.type !== type) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getZone(id: string, actor: RequestActor): Zone {
    const zone = this.store.getState().zones.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!zone) notFound("Zone not found");
    return clone(zone);
  }

  createZone(input: unknown, actor: RequestActor): Zone {
    const body = ensureObject(input, "zone");
    const state = this.store.getState();
    const zone: Zone = {
      id: newId("zone"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "zone.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "service") as Zone["type"],
      status: String(body.status ?? "active") as Zone["status"],
      polygon: body.polygon ? ensureArray(body.polygon, "zone.polygon") as GeoPoint[] : undefined,
      radius: body.radius ? ensureNumber(body.radius, "zone.radius") : undefined,
      center: body.center ? ensureObject(body.center, "zone.center") as GeoPoint : undefined,
      pricingRules: body.pricingRules ? ensureArray(body.pricingRules, "zone.pricingRules") : [],
      availabilityRules: body.availabilityRules ? ensureArray(body.availabilityRules, "zone.availabilityRules") : [],
      tags: ensureArray<string>(body.tags, "zone.tags"),
      metadata: optionalObject(body.metadata)
    };
    state.zones.push(zone);
    this.store.save();
    this.store.audit(actor, "zone.create", "zone", zone.id, undefined, zone);
    return clone(zone);
  }

  checkDeliveryAvailability(latitude: number, longitude: number, zoneId: string, actor: RequestActor): { available: boolean; distance?: number; fee?: number; estimatedMinutes?: number; reason?: string } {
    const zone = this.store.getState().zones.find((item) => item.id === zoneId && item.tenantId === actor.tenantId);
    if (!zone) notFound("Zone not found");
    if (zone.status !== "active" || zone.type !== "delivery") {
      return { available: false, reason: "Zone is not active or not a delivery zone" };
    }
    if (!zone.center) {
      return { available: false, reason: "Zone has no defined center" };
    }
    const distance = calculateDistance(latitude, longitude, zone.center.latitude, zone.center.longitude);
    if (zone.radius && distance > zone.radius) {
      return { available: false, distance, reason: "Location is outside delivery radius" };
    }
    let fee = 0;
    for (const rule of zone.pricingRules ?? []) {
      if (distance >= (rule.minDistance ?? 0) && (!rule.maxDistance || distance <= rule.maxDistance)) {
        fee = rule.baseFee + (distance * (rule.perKmFee ?? 0));
        if (rule.freeDeliveryThreshold && fee > rule.freeDeliveryThreshold) fee = 0;
        break;
      }
    }
    const estimatedMinutes = estimateETA(distance, "car");
    return { available: true, distance, fee, estimatedMinutes };
  }

  listRoutes(actor: RequestActor, query?: URLSearchParams): Route[] {
    const status = pickQuery(query, "status");
    return clone(this.store.getState().routes.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getRoute(id: string, actor: RequestActor): Route {
    const route = this.store.getState().routes.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!route) notFound("Route not found");
    return clone(route);
  }

  createRoute(input: unknown, actor: RequestActor): Route {
    const body = ensureObject(input, "route");
    const state = this.store.getState();
    const route: Route = {
      id: newId("route"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "route.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "planned") as Route["status"],
      stops: ensureArray(body.stops, "route.stops"),
      totalDistance: body.totalDistance ? ensureNumber(body.totalDistance, "route.totalDistance") : undefined,
      totalDuration: body.totalDuration ? ensureNumber(body.totalDuration, "route.totalDuration") : undefined,
      travelMode: String(body.travelMode ?? "car") as Route["travelMode"],
      tags: ensureArray<string>(body.tags, "route.tags"),
      metadata: optionalObject(body.metadata)
    };
    state.routes.push(route);
    this.store.save();
    this.store.audit(actor, "route.create", "route", route.id, undefined, route);
    return clone(route);
  }

  calculateRoute(stops: GeoPoint[], travelMode: string, actor: RequestActor): { totalDistance: number; totalDuration: number; stops: Array<{ from: GeoPoint; to: GeoPoint; distance: number; duration: number }> } {
    if (stops.length < 2) badRequest("At least 2 stops are required");
    const results: Array<{ from: GeoPoint; to: GeoPoint; distance: number; duration: number }> = [];
    let totalDistance = 0;
    let totalDuration = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const distance = calculateDistance(stops[i].latitude, stops[i].longitude, stops[i + 1].latitude, stops[i + 1].longitude);
      const duration = estimateETA(distance, travelMode);
      results.push({ from: stops[i], to: stops[i + 1], distance, duration });
      totalDistance += distance;
      totalDuration += duration;
    }
    return { totalDistance, totalDuration, stops: results };
  }

  listGeofences(actor: RequestActor): Geofence[] {
    return clone(this.store.getState().geofences.filter((item) => item.tenantId === actor.tenantId));
  }

  getGeofence(id: string, actor: RequestActor): Geofence {
    const geofence = this.store.getState().geofences.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!geofence) notFound("Geofence not found");
    return clone(geofence);
  }

  createGeofence(input: unknown, actor: RequestActor): Geofence {
    const body = ensureObject(input, "geofence");
    const state = this.store.getState();
    const geofence: Geofence = {
      id: newId("geofence"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "geofence.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "circular") as Geofence["type"],
      status: String(body.status ?? "active") as Geofence["status"],
      center: body.center ? ensureObject(body.center, "geofence.center") as GeoPoint : undefined,
      radius: body.radius ? ensureNumber(body.radius, "geofence.radius") : undefined,
      polygon: body.polygon ? ensureArray(body.polygon, "geofence.polygon") as GeoPoint[] : undefined,
      triggers: ensureArray(body.triggers, "geofence.triggers"),
      metadata: optionalObject(body.metadata)
    };
    state.geofences.push(geofence);
    this.store.save();
    this.store.audit(actor, "geofence.create", "geofence", geofence.id, undefined, geofence);
    return clone(geofence);
  }

  checkGeofence(geofenceId: string, latitude: number, longitude: number, actor: RequestActor): { inside: boolean; distance?: number; triggers: string[] } {
    const geofence = this.store.getState().geofences.find((item) => item.id === geofenceId && item.tenantId === actor.tenantId);
    if (!geofence) notFound("Geofence not found");
    if (!geofence.center || !geofence.radius) return { inside: false, triggers: [] };
    const distance = calculateDistance(latitude, longitude, geofence.center.latitude, geofence.center.longitude);
    const inside = distance <= geofence.radius;
    const triggered: string[] = [];
    if (inside) {
      for (const trigger of geofence.triggers) {
        if (trigger.type === "entry") triggered.push(trigger.action ?? "geofence.entered");
      }
    } else {
      for (const trigger of geofence.triggers) {
        if (trigger.type === "exit") triggered.push(trigger.action ?? "geofence.exited");
      }
    }
    return { inside, distance, triggers: triggered };
  }

  listCheckins(actor: RequestActor, query?: URLSearchParams): CheckIn[] {
    const userId = pickQuery(query, "userId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().checkins.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (userId && item.userId !== userId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createCheckin(input: unknown, actor: RequestActor): CheckIn {
    const body = ensureObject(input, "checkin");
    const state = this.store.getState();
    const checkin: CheckIn = {
      id: newId("checkin"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      userId: ensureString(body.userId, "checkin.userId"),
      locationId: body.locationId ? String(body.locationId) : undefined,
      addressId: body.addressId ? String(body.addressId) : undefined,
      venueId: body.venueId ? String(body.venueId) : undefined,
      geolocationId: body.geolocationId ? String(body.geolocationId) : undefined,
      latitude: ensureNumber(body.latitude, "checkin.latitude"),
      longitude: ensureNumber(body.longitude, "checkin.longitude"),
      accuracy: body.accuracy ? ensureNumber(body.accuracy, "checkin.accuracy") : undefined,
      type: String(body.type ?? "gps") as CheckIn["type"],
      status: "active",
      verificationNotes: body.verificationNotes ? String(body.verificationNotes) : undefined,
      photoUrl: body.photoUrl ? String(body.photoUrl) : undefined,
      qrCode: body.qrCode ? String(body.qrCode) : undefined,
      device: body.device ? String(body.device) : undefined,
      metadata: optionalObject(body.metadata)
    };
    state.checkins.push(checkin);
    this.store.save();
    this.store.audit(actor, "checkin.create", "checkin", checkin.id, undefined, checkin);
    return clone(checkin);
  }

  listFieldVisits(actor: RequestActor, query?: URLSearchParams): FieldVisit[] {
    const status = pickQuery(query, "status");
    const type = pickQuery(query, "type");
    const userId = pickQuery(query, "userId");
    return clone(this.store.getState().fieldVisits.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (type && item.type !== type) return false;
      if (userId && item.userId !== userId) return false;
      return true;
    }));
  }

  getFieldVisit(id: string, actor: RequestActor): FieldVisit {
    const visit = this.store.getState().fieldVisits.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!visit) notFound("Field visit not found");
    return clone(visit);
  }

  createFieldVisit(input: unknown, actor: RequestActor): FieldVisit {
    const body = ensureObject(input, "fieldVisit");
    const state = this.store.getState();
    const visit: FieldVisit = {
      id: newId("fieldvisit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "fieldVisit.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "other") as FieldVisit["type"],
      status: String(body.status ?? "scheduled") as FieldVisit["status"],
      userId: ensureString(body.userId, "fieldVisit.userId"),
      clientId: body.clientId ? String(body.clientId) : undefined,
      locationId: body.locationId ? String(body.locationId) : undefined,
      addressId: body.addressId ? String(body.addressId) : undefined,
      scheduledStart: body.scheduledStart ? String(body.scheduledStart) : undefined,
      scheduledEnd: body.scheduledEnd ? String(body.scheduledEnd) : undefined,
      actualStart: body.actualStart ? String(body.actualStart) : undefined,
      actualEnd: body.actualEnd ? String(body.actualEnd) : undefined,
      checkinId: body.checkinId ? String(body.checkinId) : undefined,
      checkoutId: body.checkoutId ? String(body.checkoutId) : undefined,
      outcome: body.outcome ? String(body.outcome) as FieldVisit["outcome"] : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      photos: body.photos ? ensureArray(body.photos, "fieldVisit.photos") : undefined,
      followUpVisitId: body.followUpVisitId ? String(body.followUpVisitId) : undefined,
      tags: ensureArray<string>(body.tags, "fieldVisit.tags"),
      metadata: optionalObject(body.metadata)
    };
    state.fieldVisits.push(visit);
    this.store.save();
    this.store.audit(actor, "fieldvisit.create", "fieldVisit", visit.id, undefined, visit);
    return clone(visit);
  }

  updateFieldVisit(id: string, input: unknown, actor: RequestActor): FieldVisit {
    const body = ensureObject(input, "fieldVisit");
    const state = this.store.getState();
    const visit = state.fieldVisits.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!visit) notFound("Field visit not found");
    const before = clone(visit);
    if (body.status !== undefined) visit.status = String(body.status) as FieldVisit["status"];
    if (body.outcome !== undefined) visit.outcome = String(body.outcome) as FieldVisit["outcome"];
    if (body.notes !== undefined) visit.notes = String(body.notes);
    if (body.checkinId !== undefined) visit.checkinId = String(body.checkinId);
    if (body.checkoutId !== undefined) visit.checkoutId = String(body.checkoutId);
    if (body.actualStart !== undefined) visit.actualStart = String(body.actualStart);
    if (body.actualEnd !== undefined) visit.actualEnd = String(body.actualEnd);
    visit.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "fieldvisit.update", "fieldVisit", visit.id, before, clone(visit));
    return clone(visit);
  }

  listVenues(actor: RequestActor): Venue[] {
    return clone(this.store.getState().venues.filter((item) => item.tenantId === actor.tenantId));
  }

  getVenue(id: string, actor: RequestActor): Venue {
    const venue = this.store.getState().venues.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!venue) notFound("Venue not found");
    return clone(venue);
  }

  createVenue(input: unknown, actor: RequestActor): Venue {
    const body = ensureObject(input, "venue");
    const state = this.store.getState();
    const venue: Venue = {
      id: newId("venue"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "venue.name"),
      description: body.description ? String(body.description) : undefined,
      addressId: body.addressId ? String(body.addressId) : undefined,
      coordinates: body.coordinates ? ensureObject(body.coordinates, "venue.coordinates") as GeoPoint : undefined,
      capacity: ensureNumber(body.capacity, "venue.capacity"),
      facilities: ensureArray<string>(body.facilities, "venue.facilities"),
      contactPerson: body.contactPerson ? String(body.contactPerson) : undefined,
      contactPhone: body.contactPhone ? String(body.contactPhone) : undefined,
      contactEmail: body.contactEmail ? String(body.contactEmail) : undefined,
      parkingInfo: body.parkingInfo ? String(body.parkingInfo) : undefined,
      mapUrl: body.mapUrl ? String(body.mapUrl) : undefined,
      directionsUrl: body.directionsUrl ? String(body.directionsUrl) : undefined,
      checkinQrCode: body.checkinQrCode ? String(body.checkinQrCode) : undefined,
      geofenceRadius: body.geofenceRadius ? ensureNumber(body.geofenceRadius, "venue.geofenceRadius") : undefined,
      status: String(body.status ?? "active") as Venue["status"],
      tags: ensureArray<string>(body.tags, "venue.tags"),
      metadata: optionalObject(body.metadata)
    };
    state.venues.push(venue);
    this.store.save();
    this.store.audit(actor, "venue.create", "venue", venue.id, undefined, venue);
    return clone(venue);
  }

  listBranches(actor: RequestActor): Branch[] {
    return clone(this.store.getState().branches.filter((item) => item.tenantId === actor.tenantId));
  }

  getBranch(id: string, actor: RequestActor): Branch {
    const branch = this.store.getState().branches.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!branch) notFound("Branch not found");
    return clone(branch);
  }

  searchNearby(latitude: number, longitude: number, radiusKm: number, entityType: string, actor: RequestActor): Array<{ id: string; name: string; type: string; distance: number; coordinates?: GeoPoint }> {
    const state = this.store.getState();
    const results: Array<{ id: string; name: string; type: string; distance: number; coordinates?: GeoPoint }> = [];
    if (entityType === "location" || entityType === "all") {
      for (const loc of state.locations.filter((item) => item.tenantId === actor.tenantId && item.status === "active")) {
        if (loc.coordinates) {
          const distance = calculateDistance(latitude, longitude, loc.coordinates.latitude, loc.coordinates.longitude);
          if (distance <= radiusKm) {
            results.push({ id: loc.id, name: loc.name, type: "location", distance, coordinates: loc.coordinates });
          }
        }
      }
    }
    if (entityType === "branch" || entityType === "all") {
      for (const branch of state.branches.filter((item) => item.tenantId === actor.tenantId && item.status === "active")) {
        if (branch.coordinates) {
          const distance = calculateDistance(latitude, longitude, branch.coordinates.latitude, branch.coordinates.longitude);
          if (distance <= radiusKm) {
            results.push({ id: branch.id, name: branch.name, type: "branch", distance, coordinates: branch.coordinates });
          }
        }
      }
    }
    if (entityType === "venue" || entityType === "all") {
      for (const venue of state.venues.filter((item) => item.tenantId === actor.tenantId && item.status === "active")) {
        if (venue.coordinates) {
          const distance = calculateDistance(latitude, longitude, venue.coordinates.latitude, venue.coordinates.longitude);
          if (distance <= radiusKm) {
            results.push({ id: venue.id, name: venue.name, type: "venue", distance, coordinates: venue.coordinates });
          }
        }
      }
    }
    return results.sort((a, b) => a.distance - b.distance);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }
}
