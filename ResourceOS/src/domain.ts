export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type ApiRole = "viewer" | "resource_manager" | "resource_admin" | "resource_analyst" | "admin" | "owner" | "auditor";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: ApiRole;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type ResourceCategory =
  | "people"
  | "equipment"
  | "rooms"
  | "vehicles"
  | "licenses"
  | "cloud"
  | "digital"
  | "training"
  | "support"
  | "sales";

export type ResourceStatus =
  | "available"
  | "allocated"
  | "booked"
  | "in_use"
  | "unavailable"
  | "maintenance"
  | "retired"
  | "archived";

export interface Resource extends BaseEntity {
  name: string;
  category: ResourceCategory;
  type: string;
  status: ResourceStatus;
  description?: string;
  ownerId?: UUID;
  skills?: string[];
  capacity: ResourceCapacity;
  cost: ResourceCost;
  location?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  createdBy: UUID;
}

export interface ResourceCapacity {
  maxHoursPerDay?: number;
  maxHoursPerWeek?: number;
  maxHoursPerMonth?: number;
  maxUnits?: number;
  availableUnits?: number;
  usedUnits?: number;
}

export interface ResourceCost {
  hourlyRate?: number;
  dailyRate?: number;
  monthlyRate?: number;
  oneTimeCost?: number;
  currency: string;
  billable: boolean;
}

export interface ResourceAllocation extends BaseEntity {
  resourceId: UUID;
  allocationType: "project" | "task" | "shift" | "temporary" | "permanent";
  projectId?: UUID;
  taskId?: UUID;
  startDate: ISODate;
  endDate: ISODate;
  allocationPercent: number;
  hoursPerWeek?: number;
  status: "requested" | "approved" | "active" | "completed" | "cancelled";
  approvedBy?: UUID;
  approvedAt?: ISODate;
  createdBy: UUID;
  notes?: string;
}

export interface ResourceBooking extends BaseEntity {
  resourceId: UUID;
  bookingType: "room" | "equipment" | "vehicle" | "trainer" | "consultant" | "device" | "license";
  requesterId: UUID;
  startDate: ISODate;
  endDate: ISODate;
  startTime?: string;
  endTime?: string;
  status: "requested" | "confirmed" | "rejected" | "cancelled" | "completed" | "no_show" | "expired";
  attendees?: number;
  purpose?: string;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  createdBy: UUID;
  notes?: string;
  conflictCheck?: BookingConflict;
}

export interface BookingConflict {
  hasConflict: boolean;
  conflictingBookingIds?: UUID[];
  conflictType?: "double_booking" | "overcapacity" | "unavailable";
  details?: string;
}

export interface ResourceAvailability extends BaseEntity {
  resourceId: UUID;
  date: ISODate;
  isAvailable: boolean;
  availableFrom?: string;
  availableTo?: string;
  reason?: string;
  blockedByBookingId?: UUID;
  blockedByAllocationId?: UUID;
}

export interface ResourceUtilization extends BaseEntity {
  resourceId: UUID;
  period: "daily" | "weekly" | "monthly";
  periodStart: ISODate;
  periodEnd: ISODate;
  availableHours: number;
  allocatedHours: number;
  usedHours: number;
  idleHours: number;
  billableHours: number;
  nonBillableHours: number;
  utilizationPercent: number;
  costPerHour?: number;
  revenuePerHour?: number;
}

export interface ResourceSkill extends BaseEntity {
  resourceId: UUID;
  skillName: string;
  proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience?: number;
  certifications?: string[];
  lastUsed?: ISODate;
  verified: boolean;
}

export interface ResourcePool extends BaseEntity {
  name: string;
  description?: string;
  poolType: "skill" | "team" | "department" | "location" | "role" | "equipment" | "license";
  resourceIds: UUID[];
  ownerId?: UUID;
  status: "active" | "inactive" | "archived";
  createdBy: UUID;
}

export interface ResourceRequest extends BaseEntity {
  requestType: ResourceCategory;
  resourceName?: string;
  skills?: string[];
  quantity: number;
  startDate: ISODate;
  endDate: ISODate;
  allocationPercent?: number;
  purpose?: string;
  projectId?: UUID;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "allocated" | "fulfilled" | "cancelled";
  requestedBy: UUID;
  reviewedBy?: UUID;
  reviewedAt?: ISODate;
  notes?: string;
}

export interface ResourceMaintenance extends BaseEntity {
  resourceId: UUID;
  maintenanceType: "preventive" | "corrective" | "predictive";
  scheduledDate: ISODate;
  completedDate?: ISODate;
  description: string;
  cost?: number;
  performedBy?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

export interface ResourceConflict extends BaseEntity {
  conflictType: "double_booking" | "over_allocation" | "skill_mismatch" | "capacity_exceeded" | "unavailable_period";
  resourceId: UUID;
  conflictingResourceIds?: UUID[];
  bookingIds?: UUID[];
  allocationIds?: UUID[];
  severity: "low" | "medium" | "high" | "critical";
  status: "detected" | "acknowledged" | "resolved" | "ignored";
  detectedAt: ISODate;
  resolvedAt?: ISODate;
  resolution?: string;
}

export interface ResourceAuditLog extends BaseEntity {
  actorId: UUID;
  role: ApiRole;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface ResourceEvent extends BaseEntity {
  event: string;
  source: "ResourceOS" | string;
  actorId: UUID;
  data: Record<string, unknown>;
}

export interface ResourceState {
  resources: Resource[];
  allocations: ResourceAllocation[];
  bookings: ResourceBooking[];
  availabilities: ResourceAvailability[];
  utilizations: ResourceUtilization[];
  skills: ResourceSkill[];
  pools: ResourcePool[];
  requests: ResourceRequest[];
  maintenances: ResourceMaintenance[];
  conflicts: ResourceConflict[];
  events: ResourceEvent[];
  auditLogs: ResourceAuditLog[];
}
