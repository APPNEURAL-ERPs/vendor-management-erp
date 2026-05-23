export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "delivery_manager" | "dispatcher" | "driver" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

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

export type DeliveryStatus = "draft" | "requested" | "approved" | "ready_for_dispatch" | "assigned" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed" | "cancelled" | "returned" | "closed";
export type DeliveryType = "physical" | "digital" | "service" | "project";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface DeliveryOrder extends BaseEntity {
  orderId: string;
  type: DeliveryType;
  status: DeliveryStatus;
  priority: Priority;
  source: string;
  destination: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: DeliveryItem[];
  totalAmount?: number;
  deliveryFee?: number;
  scheduledDate?: ISODate;
  deliveredDate?: ISODate;
  driverId?: UUID;
  shipmentId?: UUID;
  proofId?: UUID;
  trackingNumber?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface DeliveryItem {
  itemId: string;
  name: string;
  quantity: number;
  description?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  metadata: Record<string, unknown>;
}

export interface Shipment extends BaseEntity {
  shipmentId: string;
  orderId: UUID;
  trackingNumber: string;
  courierName?: string;
  courierPartner?: string;
  pickupDate?: ISODate;
  expectedDeliveryDate?: ISODate;
  actualDeliveryDate?: ISODate;
  status: DeliveryStatus;
  currentLocation?: string;
  driverId?: UUID;
  routeId?: UUID;
  events: TrackingEvent[];
  metadata: Record<string, unknown>;
}

export interface TrackingEvent extends BaseEntity {
  shipmentId: UUID;
  eventType: string;
  description: string;
  location?: string;
  timestamp: ISODate;
  performedBy?: UUID;
  metadata: Record<string, unknown>;
}

export interface Driver extends BaseEntity {
  driverId: string;
  name: string;
  email?: string;
  phone: string;
  status: "available" | "on_delivery" | "offline" | "unavailable";
  vehicleType?: string;
  vehicleNumber?: string;
  currentLocation?: { lat: number; lng: number };
  zoneId?: UUID;
  ratings?: number;
  totalDeliveries?: number;
  metadata: Record<string, unknown>;
}

export interface Route extends BaseEntity {
  routeId: string;
  name: string;
  driverId: UUID;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  startLocation: string;
  endLocation?: string;
  waypoints: RouteWaypoint[];
  estimatedDistance?: number;
  estimatedDuration?: number;
  scheduledDate: ISODate;
  completedDate?: ISODate;
  orders: UUID[];
  metadata: Record<string, unknown>;
}

export interface RouteWaypoint {
  orderId: UUID;
  sequence: number;
  location: string;
  estimatedArrival?: ISODate;
  actualArrival?: ISODate;
  status: "pending" | "visited" | "skipped";
}

export interface ProofOfDelivery extends BaseEntity {
  proofId: string;
  shipmentId: UUID;
  orderId: UUID;
  type: "signature" | "photo" | "otp" | "qr_scan" | "geo" | "email_confirmation";
  recipientName?: string;
  recipientSignature?: string;
  photoUrl?: string;
  otpVerified?: boolean;
  geoLocation?: { lat: number; lng: number };
  timestamp: ISODate;
  notes?: string;
  deliveredBy: UUID;
  metadata: Record<string, unknown>;
}

export interface DeliveryZone extends BaseEntity {
  zoneId: string;
  name: string;
  pinCodes: string[];
  city?: string;
  state?: string;
  freeDeliveryRadius?: number;
  deliveryFee?: number;
  estimatedDeliveryDays?: number;
  status: EntityStatus;
}

export interface DeliverySchedule extends BaseEntity {
  scheduleId: string;
  orderId: UUID;
  preferredDate: ISODate;
  preferredTimeSlot?: string;
  isRescheduled?: boolean;
  originalScheduleId?: UUID;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
}

export interface DeliveryCost extends BaseEntity {
  costId: string;
  orderId: UUID;
  courierCost?: number;
  packagingCost?: number;
  fuelCost?: number;
  agentPayout?: number;
  totalCost: number;
  currency?: string;
  billingDate?: ISODate;
}

export interface DeliverySLA extends BaseEntity {
  slaId: string;
  name: string;
  deliveryType: DeliveryType;
  dispatchSlaHours?: number;
  deliverySlaHours?: number;
  pickupSlaHours?: number;
  proofCaptureSlaMinutes?: number;
  status: EntityStatus;
}

export interface DeliveryIssue extends BaseEntity {
  issueId: string;
  orderId: UUID;
  shipmentId?: UUID;
  type: "delay" | "damage" | "wrong_item" | "missing_item" | "failed_attempt" | "courier_issue" | "access_denied" | "customer_unavailable" | "wrong_address" | "other";
  status: "open" | "assigned" | "in_progress" | "waiting_customer" | "waiting_courier" | "resolved" | "closed" | "reopened";
  priority: Priority;
  description: string;
  assignedTo?: UUID;
  resolution?: string;
  resolvedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface DeliveryEvent extends BaseEntity {
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

export interface DeliveryOverview {
  orders: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
  shipments: {
    total: number;
    inTransit: number;
    delivered: number;
    failed: number;
  };
  drivers: {
    total: number;
    available: number;
    onDelivery: number;
  };
  routes: {
    total: number;
    completed: number;
    inProgress: number;
  };
  proofOfDelivery: {
    total: number;
    withProof: number;
    withoutProof: number;
  };
  sla: {
    onTime: number;
    delayed: number;
    onTimePercent: number;
  };
}

export interface DeliveryState {
  orders: DeliveryOrder[];
  shipments: Shipment[];
  trackingEvents: TrackingEvent[];
  drivers: Driver[];
  routes: Route[];
  proofs: ProofOfDelivery[];
  zones: DeliveryZone[];
  schedules: DeliverySchedule[];
  costs: DeliveryCost[];
  slas: DeliverySLA[];
  issues: DeliveryIssue[];
  events: DeliveryEvent[];
  auditLogs: AuditLog[];
}
