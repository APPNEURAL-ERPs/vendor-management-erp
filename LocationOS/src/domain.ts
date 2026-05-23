export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type Role = "owner" | "admin" | "location_admin" | "location_manager" | "field_agent" | "viewer";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Location extends BaseEntity {
  name: string;
  description?: string;
  type: "office" | "warehouse" | "retail" | "restaurant" | "service_center" | "training_center" | "event_venue" | "field" | "other";
  status: "active" | "inactive" | "archived";
  addressId?: UUID;
  geolocationId?: UUID;
  coordinates?: GeoPoint;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
  facilities?: string[];
  mapUrl?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Address extends BaseEntity {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  landmark?: string;
  type: "home" | "office" | "billing" | "shipping" | "branch" | "warehouse" | "vendor" | "client" | "training_center" | "event_venue" | "other";
  status: "verified" | "unverified" | "failed" | "pending";
  latitude?: number;
  longitude?: number;
  geocodeConfidence?: number;
  geocodeProvider?: string;
  metadata: Record<string, unknown>;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface Geolocation extends BaseEntity {
  addressId?: UUID;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  source: "gps" | "geocode" | "manual" | "ip" | "wifi" | "cell" | "other";
  timestamp: ISODate;
  metadata: Record<string, unknown>;
}

export interface Zone extends BaseEntity {
  name: string;
  description?: string;
  type: "delivery" | "service" | "territory" | "geofence" | "attendance" | "restricted" | "priority" | "other";
  status: "active" | "inactive" | "archived";
  polygon?: GeoPoint[];
  radius?: number;
  center?: GeoPoint;
  pricingRules?: ZonePricingRule[];
  availabilityRules?: ZoneAvailabilityRule[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ZonePricingRule {
  minDistance?: number;
  maxDistance?: number;
  baseFee: number;
  perKmFee?: number;
  minOrderValue?: number;
  freeDeliveryThreshold?: number;
}

export interface ZoneAvailabilityRule {
  dayOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  isAvailable: boolean;
  reason?: string;
}

export interface Route extends BaseEntity {
  name: string;
  description?: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  stops: RouteStop[];
  totalDistance?: number;
  totalDuration?: number;
  travelMode: "walking" | "bike" | "car" | "truck" | "public_transport";
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface RouteStop {
  order: number;
  locationId?: UUID;
  addressId?: UUID;
  coordinates?: GeoPoint;
  name?: string;
  address?: string;
  scheduledArrival?: ISODate;
  actualArrival?: ISODate;
  status: "pending" | "arrived" | "completed" | "skipped";
  notes?: string;
  distanceFromPrevious?: number;
  durationFromPrevious?: number;
}

export interface Geofence extends BaseEntity {
  name: string;
  description?: string;
  type: "circular" | "polygon";
  status: "active" | "inactive" | "archived";
  center?: GeoPoint;
  radius?: number;
  polygon?: GeoPoint[];
  triggers: GeofenceTrigger[];
  metadata: Record<string, unknown>;
}

export interface GeofenceTrigger {
  type: "entry" | "exit" | "dwell";
  action?: string;
  notifyRoles?: string[];
  webhookUrl?: string;
  dwellTimeMinutes?: number;
}

export interface CheckIn extends BaseEntity {
  userId: string;
  locationId?: UUID;
  addressId?: UUID;
  venueId?: UUID;
  geolocationId?: UUID;
  latitude: number;
  longitude: number;
  accuracy?: number;
  type: "gps" | "qr" | "geofence" | "photo" | "manual";
  status: "active" | "verified" | "failed" | "suspicious";
  verificationNotes?: string;
  photoUrl?: string;
  qrCode?: string;
  device?: string;
  metadata: Record<string, unknown>;
}

export interface FieldVisit extends BaseEntity {
  name: string;
  description?: string;
  type: "sales" | "client" | "support" | "installation" | "training" | "vendor" | "partner" | "inspection" | "other";
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "rescheduled" | "no_show";
  userId: string;
  clientId?: string;
  locationId?: UUID;
  addressId?: UUID;
  scheduledStart?: ISODate;
  scheduledEnd?: ISODate;
  actualStart?: ISODate;
  actualEnd?: ISODate;
  checkinId?: UUID;
  checkoutId?: UUID;
  outcome?: "completed" | "rescheduled" | "no_show" | "follow_up_needed" | "proposal_required" | "issue_resolved" | "escalation_needed" | "payment_collected";
  notes?: string;
  photos?: string[];
  followUpVisitId?: UUID;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Venue extends BaseEntity {
  name: string;
  description?: string;
  addressId?: UUID;
  coordinates?: GeoPoint;
  capacity: number;
  facilities: string[];
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  parkingInfo?: string;
  mapUrl?: string;
  directionsUrl?: string;
  checkinQrCode?: string;
  geofenceRadius?: number;
  status: "active" | "inactive" | "archived";
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Territory extends BaseEntity {
  name: string;
  description?: string;
  type: "sales" | "support" | "operations" | "partner" | "field";
  status: "active" | "inactive" | "archived";
  regions?: string[];
  cities?: string[];
  states?: string[];
  postalCodes?: string[];
  polygon?: GeoPoint[];
  ownerId?: string;
  teamIds?: string[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Branch extends BaseEntity {
  name: string;
  description?: string;
  code?: string;
  addressId?: UUID;
  coordinates?: GeoPoint;
  phone?: string;
  email?: string;
  managerId?: string;
  teamIds?: string[];
  status: "active" | "inactive" | "archived";
  openingHours?: BusinessHours;
  services?: string[];
  type: "office" | "store" | "warehouse" | "service_center" | "training_center" | "partner" | "other";
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface BusinessHours {
  timezone?: string;
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  holidays?: { date: string; name: string; hours?: DayHours }[];
}

export interface DayHours {
  open: string;
  close: string;
  isClosed?: boolean;
}

export interface LocationEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface LocationOverview {
  locations: number;
  addresses: number;
  zones: number;
  routes: number;
  geofences: number;
  checkins: number;
  fieldVisits: number;
  venues: number;
  territories: number;
  branches: number;
  verifiedAddresses: number;
  activeZones: number;
}

export interface LocationState {
  locations: Location[];
  addresses: Address[];
  geolocations: Geolocation[];
  zones: Zone[];
  routes: Route[];
  geofences: Geofence[];
  checkins: CheckIn[];
  fieldVisits: FieldVisit[];
  venues: Venue[];
  territories: Territory[];
  branches: Branch[];
  events: LocationEvent[];
  auditLogs: AuditLog[];
}
