import {
  Resource,
  ResourceAllocation,
  ResourceBooking,
  ResourceAvailability,
  ResourceUtilization,
  ResourceSkill,
  ResourcePool,
  ResourceRequest,
  ResourceMaintenance,
  ResourceConflict,
  ResourceEvent,
  RequestActor,
  ResourceCategory,
  ResourceStatus,
} from "./domain";
import { DataStore } from "./core/datastore";
import {
  notFound,
  conflict,
  nowIso,
  asNumber,
  asBoolean,
  includesText,
  datesOverlap,
  calculateUtilization,
} from "./core/utils";
import {
  newResourceId,
  newAllocationId,
  newBookingId,
  newSkillId,
  newPoolId,
  newRequestId,
  newMaintenanceId,
  newConflictId,
  newEventId,
} from "./core/id";

export class ResourceService {
  constructor(private readonly store: DataStore) {}

  createResource(
    actor: RequestActor,
    data: {
      name: string;
      category: ResourceCategory;
      type: string;
      description?: string;
      ownerId?: string;
      skills?: string[];
      maxHoursPerDay?: number;
      maxHoursPerWeek?: number;
      maxHoursPerMonth?: number;
      maxUnits?: number;
      hourlyRate?: number;
      dailyRate?: number;
      monthlyRate?: number;
      currency?: string;
      billable?: boolean;
      location?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): Resource {
    const now = nowIso();
    const resource: Resource = {
      id: newResourceId(),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: data.name,
      category: data.category,
      type: data.type,
      status: "available",
      description: data.description,
      ownerId: data.ownerId,
      skills: data.skills ?? [],
      capacity: {
        maxHoursPerDay: data.maxHoursPerDay,
        maxHoursPerWeek: data.maxHoursPerWeek,
        maxHoursPerMonth: data.maxHoursPerMonth,
        maxUnits: data.maxUnits,
        availableUnits: data.maxUnits,
        usedUnits: 0,
      },
      cost: {
        hourlyRate: data.hourlyRate,
        dailyRate: data.dailyRate,
        monthlyRate: data.monthlyRate,
        currency: data.currency ?? "USD",
        billable: data.billable ?? true,
      },
      location: data.location,
      tags: data.tags ?? [],
      metadata: data.metadata ?? {},
      createdBy: actor.userId,
    };

    this.store.getState().resources.push(resource);
    this.store.save();
    this.store.audit(actor, "resource.created", "Resource", resource.id, undefined, resource);
    this.emit(actor, "resource.created", { resourceId: resource.id, name: resource.name });

    return resource;
  }

  getResource(actor: RequestActor, resourceId: string): Resource {
    const resource = this.store
      .getState()
      .resources.find((r) => r.id === resourceId && r.tenantId === actor.tenantId);

    if (!resource) {
      notFound(`Resource ${resourceId} not found`);
    }

    return resource;
  }

  listResources(
    actor: RequestActor,
    filters?: {
      category?: ResourceCategory;
      status?: ResourceStatus;
      skill?: string;
      search?: string;
    }
  ): Resource[] {
    let resources = this.store
      .getState()
      .resources.filter((r) => r.tenantId === actor.tenantId);

    if (filters?.category) {
      resources = resources.filter((r) => r.category === filters.category);
    }

    if (filters?.status) {
      resources = resources.filter((r) => r.status === filters.status);
    }

    if (filters?.skill) {
      resources = resources.filter((r) =>
        r.skills?.some((s) => includesText(s, filters.skill!))
      );
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      resources = resources.filter(
        (r) =>
          includesText(r.name, search) ||
          includesText(r.type, search) ||
          includesText(r.description, search) ||
          r.tags.some((t) => includesText(t, search))
      );
    }

    return resources;
  }

  updateResource(
    actor: RequestActor,
    resourceId: string,
    updates: Partial<Resource>
  ): Resource {
    const resource = this.getResource(actor, resourceId);
    const before = { ...resource };

    Object.assign(resource, updates, { updatedAt: nowIso() });
    this.store.save();
    this.store.audit(actor, "resource.updated", "Resource", resource.id, before, resource);

    return resource;
  }

  deleteResource(actor: RequestActor, resourceId: string): void {
    const resource = this.getResource(actor, resourceId);
    const state = this.store.getState();

    state.resources = state.resources.filter((r) => r.id !== resourceId);
    state.allocations = state.allocations.filter((a) => a.resourceId !== resourceId);
    state.bookings = state.bookings.filter((b) => b.resourceId !== resourceId);
    state.availabilities = state.availabilities.filter((a) => a.resourceId !== resourceId);
    state.utilizations = state.utilizations.filter((u) => u.resourceId !== resourceId);
    state.skills = state.skills.filter((s) => s.resourceId !== resourceId);

    this.store.save();
    this.store.audit(actor, "resource.deleted", "Resource", resourceId, resource, undefined);
    this.emit(actor, "resource.deleted", { resourceId });
  }

  createAllocation(
    actor: RequestActor,
    data: {
      resourceId: string;
      allocationType: "project" | "task" | "shift" | "temporary" | "permanent";
      projectId?: string;
      taskId?: string;
      startDate: string;
      endDate: string;
      allocationPercent: number;
      hoursPerWeek?: number;
      status?: "requested" | "approved" | "active";
      notes?: string;
    }
  ): ResourceAllocation {
    const resource = this.getResource(actor, data.resourceId);

    if (!this.checkAllocationAvailability(actor, data.resourceId, data.startDate, data.endDate, data.allocationPercent)) {
      conflict(`Resource ${data.resourceId} is over-allocated for the requested period`);
    }

    const now = nowIso();
    const allocation: ResourceAllocation = {
      id: newAllocationId(),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      resourceId: data.resourceId,
      allocationType: data.allocationType,
      projectId: data.projectId,
      taskId: data.taskId,
      startDate: data.startDate,
      endDate: data.endDate,
      allocationPercent: data.allocationPercent,
      hoursPerWeek: data.hoursPerWeek,
      status: data.status ?? "requested",
      createdBy: actor.userId,
      notes: data.notes,
    };

    this.store.getState().allocations.push(allocation);

    if (allocation.status === "approved" || allocation.status === "active") {
      this.updateResourceStatus(actor, data.resourceId, "allocated");
    }

    this.store.save();
    this.store.audit(actor, "allocation.created", "ResourceAllocation", allocation.id, undefined, allocation);
    this.emit(actor, "resource.allocated", { allocationId: allocation.id, resourceId: data.resourceId });

    return allocation;
  }

  private checkAllocationAvailability(
    actor: RequestActor,
    resourceId: string,
    startDate: string,
    endDate: string,
    newAllocationPercent: number
  ): boolean {
    const state = this.store.getState();
    const activeAllocations = state.allocations.filter(
      (a) =>
        a.resourceId === resourceId &&
        (a.status === "active" || a.status === "approved") &&
        datesOverlap(a.startDate, a.endDate, startDate, endDate)
    );

    const totalAllocation = activeAllocations.reduce((sum, a) => sum + a.allocationPercent, 0);
    return totalAllocation + newAllocationPercent <= 100;
  }

  createBooking(
    actor: RequestActor,
    data: {
      resourceId: string;
      bookingType: "room" | "equipment" | "vehicle" | "trainer" | "consultant" | "device" | "license";
      startDate: string;
      endDate: string;
      startTime?: string;
      endTime?: string;
      attendees?: number;
      purpose?: string;
      status?: "requested" | "confirmed";
      notes?: string;
    }
  ): ResourceBooking {
    const resource = this.getResource(actor, data.resourceId);

    if (resource.status === "unavailable" || resource.status === "maintenance") {
      conflict(`Resource ${data.resourceId} is currently unavailable`);
    }

    const conflictCheck = this.checkBookingConflicts(actor, data.resourceId, data.startDate, data.endDate, data.startTime, data.endTime);

    if (conflictCheck.hasConflict) {
      conflict(`Resource ${data.resourceId} has booking conflicts: ${conflictCheck.details}`);
    }

    const now = nowIso();
    const booking: ResourceBooking = {
      id: newBookingId(),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      resourceId: data.resourceId,
      bookingType: data.bookingType,
      requesterId: actor.userId,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status ?? "requested",
      attendees: data.attendees,
      purpose: data.purpose,
      createdBy: actor.userId,
      notes: data.notes,
      conflictCheck,
    };

    this.store.getState().bookings.push(booking);

    if (booking.status === "confirmed") {
      this.updateResourceStatus(actor, data.resourceId, "booked");
    }

    this.store.save();
    this.store.audit(actor, "booking.created", "ResourceBooking", booking.id, undefined, booking);
    this.emit(actor, "resource.booked", { bookingId: booking.id, resourceId: data.resourceId });

    return booking;
  }

  private checkBookingConflicts(
    actor: RequestActor,
    resourceId: string,
    startDate: string,
    endDate: string,
    startTime?: string,
    endTime?: string
  ): { hasConflict: boolean; conflictingBookingIds?: string[]; conflictType?: string; details?: string } {
    const state = this.store.getState();
    const conflictingBookings = state.bookings.filter(
      (b) =>
        b.resourceId === resourceId &&
        (b.status === "confirmed" || b.status === "requested") &&
        datesOverlap(b.startDate, b.endDate, startDate, endDate)
    );

    if (conflictingBookings.length > 0) {
      return {
        hasConflict: true,
        conflictingBookingIds: conflictingBookings.map((b) => b.id),
        conflictType: "double_booking",
        details: `Found ${conflictingBookings.length} conflicting booking(s)`,
      };
    }

    return { hasConflict: false };
  }

  getResourceAvailability(
    actor: RequestActor,
    resourceId: string,
    startDate: string,
    endDate: string
  ): ResourceAvailability[] {
    this.getResource(actor, resourceId);

    return this.store.getState().availabilities.filter(
      (a) => a.resourceId === resourceId && a.date >= startDate && a.date <= endDate
    );
  }

  getResourceUtilization(
    actor: RequestActor,
    resourceId: string,
    periodStart: string,
    periodEnd: string
  ): ResourceUtilization | undefined {
    return this.store
      .getState()
      .utilizations.find(
        (u) =>
          u.resourceId === resourceId &&
          u.periodStart >= periodStart &&
          u.periodEnd <= periodEnd
      );
  }

  calculateResourceUtilization(
    actor: RequestActor,
    resourceId: string,
    periodStart: string,
    periodEnd: string
  ): ResourceUtilization {
    const resource = this.getResource(actor, resourceId);
    const state = this.store.getState();

    const allocations = state.allocations.filter(
      (a) =>
        a.resourceId === resourceId &&
        (a.status === "active" || a.status === "approved") &&
        datesOverlap(a.startDate, a.endDate, periodStart, periodEnd)
    );

    const totalAllocatedHours = allocations.reduce((sum, a) => {
      const weeks = Math.ceil(
        (new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      return sum + (a.hoursPerWeek ?? 40) * weeks * (a.allocationPercent / 100);
    }, 0);

    const maxHoursPerMonth = resource.capacity.maxHoursPerMonth ?? 160;
    const availableHours = maxHoursPerMonth;
    const allocatedHours = totalAllocatedHours;
    const usedHours = allocatedHours;
    const idleHours = Math.max(0, availableHours - usedHours);
    const billableHours = resource.cost.billable ? usedHours : 0;
    const nonBillableHours = usedHours - billableHours;
    const utilizationPercent = calculateUtilization(usedHours, availableHours);

    const now = nowIso();
    return {
      id: `util_${Date.now().toString(36)}`,
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      resourceId,
      period: "monthly",
      periodStart,
      periodEnd,
      availableHours,
      allocatedHours,
      usedHours,
      idleHours,
      billableHours,
      nonBillableHours,
      utilizationPercent,
      costPerHour: resource.cost.hourlyRate,
    };
  }

  searchResources(
    actor: RequestActor,
    criteria: {
      category?: ResourceCategory;
      skills?: string[];
      availableFrom?: string;
      availableTo?: string;
      minUtilization?: number;
      maxUtilization?: number;
      search?: string;
    }
  ): Resource[] {
    let resources = this.listResources(actor);

    if (criteria.category) {
      resources = resources.filter((r) => r.category === criteria.category);
    }

    if (criteria.skills && criteria.skills.length > 0) {
      resources = resources.filter((r) =>
        criteria.skills!.every((skill) =>
          r.skills?.some((s) => includesText(s, skill))
        )
      );
    }

    if (criteria.search) {
      resources = resources.filter(
        (r) =>
          includesText(r.name, criteria.search!) ||
          includesText(r.type, criteria.search!) ||
          includesText(r.description, criteria.search!)
      );
    }

    if (criteria.availableFrom || criteria.availableTo) {
      resources = resources.filter((r) => {
        if (r.status === "available") return true;

        const bookings = this.store.getState().bookings.filter(
          (b) => b.resourceId === r.id && b.status === "confirmed"
        );

        if (criteria.availableFrom && criteria.availableTo) {
          return !bookings.some((b) =>
            datesOverlap(b.startDate, b.endDate, criteria.availableFrom!, criteria.availableTo!)
          );
        }

        return true;
      });
    }

    return resources;
  }

  createSkill(
    actor: RequestActor,
    data: {
      resourceId: string;
      skillName: string;
      proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
      yearsOfExperience?: number;
      certifications?: string[];
      verified?: boolean;
    }
  ): ResourceSkill {
    this.getResource(actor, data.resourceId);

    const now = nowIso();
    const skill: ResourceSkill = {
      id: newSkillId(),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      resourceId: data.resourceId,
      skillName: data.skillName,
      proficiencyLevel: data.proficiencyLevel,
      yearsOfExperience: data.yearsOfExperience,
      certifications: data.certifications ?? [],
      verified: data.verified ?? false,
    };

    this.store.getState().skills.push(skill);
    this.store.save();
    this.store.audit(actor, "skill.created", "ResourceSkill", skill.id, undefined, skill);

    return skill;
  }

  createPool(
    actor: RequestActor,
    data: {
      name: string;
      description?: string;
      poolType: "skill" | "team" | "department" | "location" | "role" | "equipment" | "license";
      resourceIds: string[];
      ownerId?: string;
    }
  ): ResourcePool {
    data.resourceIds.forEach((id) => this.getResource(actor, id));

    const now = nowIso();
    const pool: ResourcePool = {
      id: newPoolId(),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: data.name,
      description: data.description,
      poolType: data.poolType,
      resourceIds: data.resourceIds,
      ownerId: data.ownerId,
      status: "active",
      createdBy: actor.userId,
    };

    this.store.getState().pools.push(pool);
    this.store.save();
    this.store.audit(actor, "pool.created", "ResourcePool", pool.id, undefined, pool);

    return pool;
  }

  createRequest(
    actor: RequestActor,
    data: {
      requestType: ResourceCategory;
      resourceName?: string;
      skills?: string[];
      quantity: number;
      startDate: string;
      endDate: string;
      allocationPercent?: number;
      purpose?: string;
      projectId?: string;
    }
  ): ResourceRequest {
    const now = nowIso();
    const request: ResourceRequest = {
      id: newRequestId(),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      requestType: data.requestType,
      resourceName: data.resourceName,
      skills: data.skills,
      quantity: data.quantity,
      startDate: data.startDate,
      endDate: data.endDate,
      allocationPercent: data.allocationPercent,
      purpose: data.purpose,
      projectId: data.projectId,
      status: "draft",
      requestedBy: actor.userId,
    };

    this.store.getState().requests.push(request);
    this.store.save();
    this.store.audit(actor, "request.created", "ResourceRequest", request.id, undefined, request);

    return request;
  }

  createMaintenance(
    actor: RequestActor,
    data: {
      resourceId: string;
      maintenanceType: "preventive" | "corrective" | "predictive";
      scheduledDate: string;
      description: string;
      cost?: number;
      performedBy?: string;
    }
  ): ResourceMaintenance {
    this.getResource(actor, data.resourceId);

    const now = nowIso();
    const maintenance: ResourceMaintenance = {
      id: newMaintenanceId(),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      resourceId: data.resourceId,
      maintenanceType: data.maintenanceType,
      scheduledDate: data.scheduledDate,
      description: data.description,
      cost: data.cost,
      performedBy: data.performedBy,
      status: "scheduled",
    };

    this.store.getState().maintenances.push(maintenance);
    this.store.save();
    this.store.audit(actor, "maintenance.created", "ResourceMaintenance", maintenance.id, undefined, maintenance);

    return maintenance;
  }

  detectConflicts(actor: RequestActor): ResourceConflict[] {
    const state = this.store.getState();
    const conflicts: ResourceConflict[] = [];

    const bookingsByResource = new Map<string, ResourceBooking[]>();
    for (const booking of state.bookings) {
      if (booking.status === "confirmed" || booking.status === "requested") {
        const existing = bookingsByResource.get(booking.resourceId) ?? [];
        existing.push(booking);
        bookingsByResource.set(booking.resourceId, existing);
      }
    }

    for (const [resourceId, bookings] of bookingsByResource) {
      for (let i = 0; i < bookings.length; i++) {
        for (let j = i + 1; j < bookings.length; j++) {
          if (datesOverlap(bookings[i].startDate, bookings[i].endDate, bookings[j].startDate, bookings[j].endDate)) {
            const now = nowIso();
            const conflict: ResourceConflict = {
              id: newConflictId(),
              tenantId: actor.tenantId,
              createdAt: now,
              updatedAt: now,
              conflictType: "double_booking",
              resourceId,
              bookingIds: [bookings[i].id, bookings[j].id],
              severity: "high",
              status: "detected",
              detectedAt: now,
            };
            conflicts.push(conflict);
            state.conflicts.push(conflict);
          }
        }
      }
    }

    for (const allocation of state.allocations) {
      if (allocation.status === "active" || allocation.status === "approved") {
        const resourceAllocations = state.allocations.filter(
          (a) =>
            a.id !== allocation.id &&
            a.resourceId === allocation.resourceId &&
            (a.status === "active" || a.status === "approved") &&
            datesOverlap(a.startDate, a.endDate, allocation.startDate, allocation.endDate)
        );

        const totalAllocation = resourceAllocations.reduce(
          (sum, a) => sum + a.allocationPercent,
          0
        );

        if (totalAllocation > 100) {
          const now = nowIso();
          const conflict: ResourceConflict = {
            id: newConflictId(),
            tenantId: actor.tenantId,
            createdAt: now,
            updatedAt: now,
            conflictType: "over_allocation",
            resourceId: allocation.resourceId,
            allocationIds: [allocation.id, ...resourceAllocations.map((a) => a.id)],
            severity: "critical",
            status: "detected",
            detectedAt: now,
          };
          conflicts.push(conflict);
          state.conflicts.push(conflict);
          this.emit(actor, "resource.conflict.detected", {
            conflictId: conflict.id,
            resourceId: allocation.resourceId,
            type: "over_allocation",
          });
        }
      }
    }

    this.store.save();
    return conflicts;
  }

  getAnalytics(actor: RequestActor): {
    totalResources: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    totalAllocations: number;
    activeAllocations: number;
    totalBookings: number;
    confirmedBookings: number;
    conflicts: number;
    averageUtilization: number;
  } {
    const state = this.store.getState();
    const resources = state.resources.filter((r) => r.tenantId === actor.tenantId);

    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const resource of resources) {
      byCategory[resource.category] = (byCategory[resource.category] ?? 0) + 1;
      byStatus[resource.status] = (byStatus[resource.status] ?? 0) + 1;
    }

    const activeAllocations = state.allocations.filter(
      (a) => a.status === "active" || a.status === "approved"
    );

    const confirmedBookings = state.bookings.filter((b) => b.status === "confirmed");

    const utilizations = state.utilizations.filter((u) => u.tenantId === actor.tenantId);
    const averageUtilization =
      utilizations.length > 0
        ? utilizations.reduce((sum, u) => sum + u.utilizationPercent, 0) / utilizations.length
        : 0;

    return {
      totalResources: resources.length,
      byCategory,
      byStatus,
      totalAllocations: state.allocations.length,
      activeAllocations: activeAllocations.length,
      totalBookings: state.bookings.length,
      confirmedBookings: confirmedBookings.length,
      conflicts: state.conflicts.filter((c) => c.status === "detected").length,
      averageUtilization: Math.round(averageUtilization * 100) / 100,
    };
  }

  private updateResourceStatus(actor: RequestActor, resourceId: string, status: ResourceStatus): void {
    const resource = this.getResource(actor, resourceId);
    resource.status = status;
    resource.updatedAt = nowIso();
    this.store.save();
  }

  private emit(actor: RequestActor, event: string, data: Record<string, unknown>): void {
    const now = nowIso();
    const payload: ResourceEvent = {
      id: newEventId(),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      event,
      source: "ResourceOS",
      actorId: actor.userId,
      data,
    };

    this.store.getState().events.unshift(payload);
    this.store.save();
  }
}
