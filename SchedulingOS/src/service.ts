import { DataStore } from "./core/datastore";
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  AvailabilityRule,
  AvailabilityType,
  Booking,
  BookingPage,
  BookingStatus,
  Calendar,
  Deadline,
  DeadlineStatus,
  Reminder,
  ReminderChannel,
  ReminderStatus,
  ReminderTiming,
  RequestActor,
  Schedule,
  ScheduleTemplate,
  ScheduleType,
  SchedulingEvent,
  SchedulingEventType,
  SchedulingOverview,
  TimeSlot,
  WaitlistEntry,
  WaitlistStatus
} from "./domain";
import { badRequest, conflict, countBy, ensureArray, ensureBoolean, ensureEnum, ensureNumber, ensureObject, ensureString, optionalObject, optionalString, pickBoolQuery, pickNumberQuery, pickQuery } from "./core/utils";
import { newId, nowIso, parseDate, plusDays, slotsOverlap } from "./core/id";

export class SchedulingService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "SchedulingOS service is ready";
  }

  overview(actor: RequestActor): SchedulingOverview {
    const state = this.store.getState();
    const now = nowIso();
    return {
      calendars: state.calendars.filter(c => c.tenantId === actor.tenantId).length,
      schedules: {
        total: state.schedules.filter(s => s.tenantId === actor.tenantId).length,
        upcoming: state.schedules.filter(s => s.tenantId === actor.tenantId && s.startTime > now && s.status !== "cancelled").length,
        completed: state.schedules.filter(s => s.tenantId === actor.tenantId && s.status === "completed").length,
        cancelled: state.schedules.filter(s => s.tenantId === actor.tenantId && s.status === "cancelled").length
      },
      appointments: {
        total: state.appointments.filter(a => a.tenantId === actor.tenantId).length,
        upcoming: state.appointments.filter(a => a.tenantId === actor.tenantId && a.startTime > now && !["cancelled", "completed", "no_show"].includes(a.status)).length,
        completed: state.appointments.filter(a => a.tenantId === actor.tenantId && a.status === "completed").length,
        noShow: state.appointments.filter(a => a.tenantId === actor.tenantId && a.status === "no_show").length
      },
      bookings: {
        total: state.bookings.filter(b => b.tenantId === actor.tenantId).length,
        pending: state.bookings.filter(b => b.tenantId === actor.tenantId && b.status === "pending").length,
        confirmed: state.bookings.filter(b => b.tenantId === actor.tenantId && b.status === "confirmed").length,
        completed: state.bookings.filter(b => b.tenantId === actor.tenantId && b.status === "completed").length,
        cancelled: state.bookings.filter(b => b.tenantId === actor.tenantId && b.status === "cancelled").length
      },
      timeSlots: {
        total: state.timeSlots.filter(t => t.tenantId === actor.tenantId).length,
        available: state.timeSlots.filter(t => t.tenantId === actor.tenantId && t.status === "available").length,
        booked: state.timeSlots.filter(t => t.tenantId === actor.tenantId && t.bookedCount > 0).length
      },
      reminders: {
        total: state.reminders.filter(r => r.tenantId === actor.tenantId).length,
        pending: state.reminders.filter(r => r.tenantId === actor.tenantId && r.status === "pending").length,
        sent: state.reminders.filter(r => r.tenantId === actor.tenantId && r.status === "sent").length
      },
      deadlines: {
        total: state.deadlines.filter(d => d.tenantId === actor.tenantId).length,
        upcoming: state.deadlines.filter(d => d.tenantId === actor.tenantId && d.status === "upcoming").length,
        overdue: state.deadlines.filter(d => d.tenantId === actor.tenantId && d.status === "overdue").length
      }
    };
  }

  listCalendars(actor: RequestActor): Calendar[] {
    return this.store.getState().calendars.filter(c => c.tenantId === actor.tenantId);
  }

  createCalendar(input: unknown, actor: RequestActor): Calendar {
    const body = ensureObject(input, "calendar");
    const state = this.store.getState();
    const name = ensureString(body.name, "calendar.name");
    const calendar: Calendar = {
      id: newId("cal"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name,
      description: optionalString(body.description),
      ownerId: optionalString(body.ownerId),
      type: ensureEnum(body.type, "calendar.type", ["personal", "team", "resource", "public", "booking"], "personal"),
      timezone: ensureString(body.timezone, "calendar.timezone", "UTC"),
      status: ensureEnum(body.status, "calendar.status", ["active", "inactive", "archived", "draft"], "active"),
      metadata: optionalObject(body.metadata)
    };
    state.calendars.push(calendar);
    this.store.save();
    this.store.audit(actor, "calendar.create", "calendar", calendar.id, undefined, calendar);
    return calendar;
  }

  listSchedules(actor: RequestActor, query?: URLSearchParams): Schedule[] {
    const calendarId = pickQuery(query, "calendarId");
    const status = pickQuery(query, "status");
    const search = pickQuery(query, "search")?.toLowerCase();
    const from = pickQuery(query, "from");
    const to = pickQuery(query, "to");
    const ownerId = pickQuery(query, "ownerId");
    const type = pickQuery(query, "type");
    return this.store.getState().schedules.filter(s => {
      if (s.tenantId !== actor.tenantId) return false;
      if (calendarId && s.calendarId !== calendarId) return false;
      if (status && s.status !== status) return false;
      if (ownerId && s.ownerId !== ownerId) return false;
      if (type && s.type !== type) return false;
      if (search && !`${s.title} ${s.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (from && s.startTime < from) return false;
      if (to && s.startTime > to) return false;
      return true;
    });
  }

  createSchedule(input: unknown, actor: RequestActor): Schedule {
    const body = ensureObject(input, "schedule");
    const state = this.store.getState();
    const title = ensureString(body.title, "schedule.title");
    const startTime = ensureString(body.startTime, "schedule.startTime");
    const endTime = ensureString(body.endTime, "schedule.endTime");
    const conflict = this.checkScheduleConflict(actor.tenantId, startTime, endTime, body.calendarId ? String(body.calendarId) : undefined);
    if (conflict) {
      badRequest("Schedule conflicts with existing event");
    }
    const schedule: Schedule = {
      id: newId("sched"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      calendarId: optionalString(body.calendarId),
      title,
      description: optionalString(body.description),
      type: ensureEnum(body.type, "schedule.type", ["meeting", "appointment", "class", "event", "task", "reminder", "deadline", "booking", "shift", "block"], "meeting"),
      status: "scheduled",
      startTime,
      endTime,
      durationMinutes: ensureNumber(body.durationMinutes, "schedule.durationMinutes", Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)),
      timezone: ensureString(body.timezone, "schedule.timezone", "UTC"),
      location: optionalString(body.location),
      meetingLink: optionalString(body.meetingLink),
      ownerId: optionalString(body.ownerId),
      attendeeIds: ensureArray(body.attendeeIds, "schedule.attendeeIds"),
      resourceIds: ensureArray(body.resourceIds, "schedule.resourceIds"),
      bookingId: optionalString(body.bookingId),
      parentRecurringId: optionalString(body.parentRecurringId),
      reminderIds: [],
      metadata: optionalObject(body.metadata)
    };
    state.schedules.push(schedule);
    this.store.save();
    this.store.audit(actor, "schedule.create", "schedule", schedule.id, undefined, schedule);
    this.emitEvent(actor, "appointment.scheduled", { scheduleId: schedule.id, title: schedule.title });
    return schedule;
  }

  updateSchedule(id: string, input: unknown, actor: RequestActor): Schedule {
    const state = this.store.getState();
    const schedule = state.schedules.find(s => s.id === id && s.tenantId === actor.tenantId);
    if (!schedule) badRequest("Schedule not found");
    const before = { ...schedule };
    const body = ensureObject(input, "schedule");
    if (body.title !== undefined) schedule.title = ensureString(body.title, "schedule.title");
    if (body.description !== undefined) schedule.description = optionalString(body.description);
    if (body.status !== undefined) schedule.status = ensureEnum(body.status, "schedule.status", ["scheduled", "confirmed", "cancelled", "completed", "no_show"]);
    if (body.startTime !== undefined || body.endTime !== undefined) {
      const startTime = body.startTime ? ensureString(body.startTime, "startTime") : schedule.startTime;
      const endTime = body.endTime ? ensureString(body.endTime, "endTime") : schedule.endTime;
      const conflict = this.checkScheduleConflict(actor.tenantId, startTime, endTime, schedule.calendarId, id);
      if (conflict) badRequest("Schedule conflicts with existing event");
      schedule.startTime = startTime;
      schedule.endTime = endTime;
      schedule.durationMinutes = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
    }
    if (body.location !== undefined) schedule.location = optionalString(body.location);
    if (body.meetingLink !== undefined) schedule.meetingLink = optionalString(body.meetingLink);
    if (body.attendeeIds !== undefined) schedule.attendeeIds = ensureArray(body.attendeeIds, "schedule.attendeeIds");
    if (body.resourceIds !== undefined) schedule.resourceIds = ensureArray(body.resourceIds, "schedule.resourceIds");
    if (body.metadata !== undefined) schedule.metadata = optionalObject(body.metadata);
    schedule.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "schedule.update", "schedule", schedule.id, before, schedule);
    return { ...schedule };
  }

  listAppointments(actor: RequestActor, query?: URLSearchParams): Appointment[] {
    const status = pickQuery(query, "status");
    const type = pickQuery(query, "type");
    const search = pickQuery(query, "search")?.toLowerCase();
    const from = pickQuery(query, "from");
    const to = pickQuery(query, "to");
    const clientId = pickQuery(query, "clientId");
    const hostId = pickQuery(query, "hostId");
    return this.store.getState().appointments.filter(a => {
      if (a.tenantId !== actor.tenantId) return false;
      if (status && a.status !== status) return false;
      if (type && a.type !== type) return false;
      if (clientId && a.clientId !== clientId) return false;
      if (hostId && a.hostId !== hostId) return false;
      if (search && !`${a.title} ${a.clientName} ${a.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (from && a.startTime < from) return false;
      if (to && a.startTime > to) return false;
      return true;
    });
  }

  createAppointment(input: unknown, actor: RequestActor): Appointment {
    const body = ensureObject(input, "appointment");
    const state = this.store.getState();
    const title = ensureString(body.title, "appointment.title");
    const clientName = ensureString(body.clientName, "appointment.clientName");
    const hostName = ensureString(body.hostName, "appointment.hostName");
    const startTime = ensureString(body.startTime, "appointment.startTime");
    const endTime = ensureString(body.endTime, "appointment.endTime");
    const appointment: Appointment = {
      id: newId("appt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title,
      description: optionalString(body.description),
      type: ensureEnum(body.type, "appointment.type", ["consultation", "demo", "interview", "support", "service", "medical", "coaching", "inspection"], "consultation"),
      status: "requested",
      calendarId: optionalString(body.calendarId),
      scheduleId: optionalString(body.scheduleId),
      startTime,
      endTime,
      durationMinutes: ensureNumber(body.durationMinutes, "appointment.durationMinutes", 30),
      timezone: ensureString(body.timezone, "appointment.timezone", "UTC"),
      clientId: optionalString(body.clientId),
      clientName,
      clientEmail: optionalString(body.clientEmail),
      clientPhone: optionalString(body.clientPhone),
      hostId: optionalString(body.hostId),
      hostName,
      location: optionalString(body.location),
      meetingLink: optionalString(body.meetingLink),
      notes: optionalString(body.notes),
      bookingId: optionalString(body.bookingId),
      reminderIds: [],
      metadata: optionalObject(body.metadata)
    };
    state.appointments.push(appointment);
    this.store.save();
    this.store.audit(actor, "appointment.create", "appointment", appointment.id, undefined, appointment);
    this.emitEvent(actor, "appointment.scheduled", { appointmentId: appointment.id, title: appointment.title, clientName });
    return appointment;
  }

  updateAppointmentStatus(id: string, status: AppointmentStatus, actor: RequestActor, reason?: string): Appointment {
    const state = this.store.getState();
    const appointment = state.appointments.find(a => a.id === id && a.tenantId === actor.tenantId);
    if (!appointment) badRequest("Appointment not found");
    const before = appointment.status;
    appointment.status = status;
    appointment.updatedAt = nowIso();
    if (reason) appointment.notes = (appointment.notes ? appointment.notes + "\n" : "") + `[${status}] ${reason}`;
    this.store.save();
    this.store.audit(actor, "appointment.status.update", "appointment", appointment.id, { status: before }, { status });
    this.emitEvent(actor, `appointment.${status}` as SchedulingEventType, { appointmentId: appointment.id, title: appointment.title });
    return { ...appointment };
  }

  listBookings(actor: RequestActor, query?: URLSearchParams): Booking[] {
    const status = pickQuery(query, "status");
    const serviceType = pickQuery(query, "serviceType");
    const search = pickQuery(query, "search")?.toLowerCase();
    const from = pickQuery(query, "from");
    const to = pickQuery(query, "to");
    const customerId = pickQuery(query, "customerId");
    const hostId = pickQuery(query, "hostId");
    return this.store.getState().bookings.filter(b => {
      if (b.tenantId !== actor.tenantId) return false;
      if (status && b.status !== status) return false;
      if (serviceType && b.serviceType !== serviceType) return false;
      if (customerId && b.customerId !== customerId) return false;
      if (hostId && b.hostId !== hostId) return false;
      if (search && !`${b.title} ${b.customerName} ${b.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (from && b.startTime < from) return false;
      if (to && b.startTime > to) return false;
      return true;
    });
  }

  createBooking(input: unknown, actor: RequestActor): Booking {
    const body = ensureObject(input, "booking");
    const state = this.store.getState();
    const title = ensureString(body.title, "booking.title");
    const customerName = ensureString(body.customerName, "booking.customerName");
    const hostName = ensureString(body.hostName, "booking.hostName");
    const serviceType = ensureString(body.serviceType, "booking.serviceType");
    const startTime = ensureString(body.startTime, "booking.startTime");
    const endTime = ensureString(body.endTime, "booking.endTime");
    const conflict = this.checkScheduleConflict(actor.tenantId, startTime, endTime);
    if (conflict) badRequest("Booking slot is not available");
    const booking: Booking = {
      id: newId("book"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title,
      description: optionalString(body.description),
      status: "pending",
      calendarId: optionalString(body.calendarId),
      scheduleId: optionalString(body.scheduleId),
      startTime,
      endTime,
      durationMinutes: ensureNumber(body.durationMinutes, "booking.durationMinutes", 30),
      timezone: ensureString(body.timezone, "booking.timezone", "UTC"),
      serviceType,
      customerId: optionalString(body.customerId),
      customerName,
      customerEmail: optionalString(body.customerEmail),
      customerPhone: optionalString(body.customerPhone),
      hostId: optionalString(body.hostId),
      hostName,
      location: optionalString(body.location),
      meetingLink: optionalString(body.meetingLink),
      resourceIds: ensureArray(body.resourceIds, "booking.resourceIds"),
      quantity: ensureNumber(body.quantity, "booking.quantity", 1),
      price: body.price !== undefined ? ensureNumber(body.price, "booking.price") : undefined,
      currency: optionalString(body.currency),
      paymentStatus: optionalString(body.paymentStatus) as Booking["paymentStatus"],
      paymentLink: optionalString(body.paymentLink),
      reminderIds: [],
      metadata: optionalObject(body.metadata)
    };
    state.bookings.push(booking);
    this.store.save();
    this.store.audit(actor, "booking.create", "booking", booking.id, undefined, booking);
    this.emitEvent(actor, "booking.created", { bookingId: booking.id, title: booking.title, customerName });
    return booking;
  }

  updateBookingStatus(id: string, status: BookingStatus, actor: RequestActor, reason?: string): Booking {
    const state = this.store.getState();
    const booking = state.bookings.find(b => b.id === id && b.tenantId === actor.tenantId);
    if (!booking) badRequest("Booking not found");
    const before = booking.status;
    booking.status = status;
    booking.updatedAt = nowIso();
    if (status === "cancelled" && reason) booking.cancellationReason = reason;
    if (status === "rescheduled" && reason) booking.rescheduleReason = reason;
    this.store.save();
    this.store.audit(actor, "booking.status.update", "booking", booking.id, { status: before }, { status, reason });
    this.emitEvent(actor, `booking.${status}` as SchedulingEventType, { bookingId: booking.id, title: booking.title });
    return { ...booking };
  }

  listTimeSlots(actor: RequestActor, query?: URLSearchParams): TimeSlot[] {
    const date = pickQuery(query, "date");
    const status = pickQuery(query, "status");
    const serviceType = pickQuery(query, "serviceType");
    const ownerId = pickQuery(query, "ownerId");
    return this.store.getState().timeSlots.filter(t => {
      if (t.tenantId !== actor.tenantId) return false;
      if (status && t.status !== status) return false;
      if (serviceType && t.serviceType !== serviceType) return false;
      if (ownerId && t.ownerId !== ownerId) return false;
      if (date) {
        const slotDate = t.startTime.split("T")[0];
        if (slotDate !== date) return false;
      }
      return true;
    });
  }

  createTimeSlot(input: unknown, actor: RequestActor): TimeSlot {
    const body = ensureObject(input, "timeSlot");
    const state = this.store.getState();
    const startTime = ensureString(body.startTime, "timeSlot.startTime");
    const endTime = ensureString(body.endTime, "timeSlot.endTime");
    const slot: TimeSlot = {
      id: newId("slot"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      calendarId: optionalString(body.calendarId),
      title: ensureString(body.title, "timeSlot.title"),
      startTime,
      endTime,
      durationMinutes: ensureNumber(body.durationMinutes, "timeSlot.durationMinutes", 30),
      bufferMinutes: ensureNumber(body.bufferMinutes, "timeSlot.bufferMinutes", 0),
      capacity: ensureNumber(body.capacity, "timeSlot.capacity", 1),
      bookedCount: 0,
      status: "available",
      serviceType: optionalString(body.serviceType),
      ownerId: optionalString(body.ownerId),
      hostId: optionalString(body.hostId),
      location: optionalString(body.location),
      requiresApproval: ensureBoolean(body.requiresApproval, false),
      metadata: optionalObject(body.metadata)
    };
    state.timeSlots.push(slot);
    this.store.save();
    this.store.audit(actor, "timeslot.create", "timeSlot", slot.id, undefined, slot);
    return slot;
  }

  listAvailabilityRules(actor: RequestActor, query?: URLSearchParams): AvailabilityRule[] {
    const targetType = pickQuery(query, "targetType");
    const targetId = pickQuery(query, "targetId");
    const type = pickQuery(query, "type");
    return this.store.getState().availabilityRules.filter(r => {
      if (r.tenantId !== actor.tenantId) return false;
      if (targetType && r.targetType !== targetType) return false;
      if (targetId && r.targetId !== targetId) return false;
      if (type && r.type !== type) return false;
      return true;
    });
  }

  createAvailabilityRule(input: unknown, actor: RequestActor): AvailabilityRule {
    const body = ensureObject(input, "availabilityRule");
    const state = this.store.getState();
    const rule: AvailabilityRule = {
      id: newId("avail"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "availabilityRule.name"),
      ownerId: optionalString(body.ownerId),
      targetType: ensureEnum(body.targetType, "availabilityRule.targetType", ["user", "resource", "room", "trainer", "team"], "user"),
      targetId: optionalString(body.targetId),
      type: ensureEnum(body.type, "availabilityRule.type", ["working_hours", "blocked", "leave", "busy", "custom"], "working_hours"),
      dayOfWeek: body.dayOfWeek ? ensureArray<number>(body.dayOfWeek, "availabilityRule.dayOfWeek") : undefined,
      startTime: optionalString(body.startTime),
      endTime: optionalString(body.endTime),
      dateFrom: optionalString(body.dateFrom),
      dateTo: optionalString(body.dateTo),
      isAvailable: ensureBoolean(body.isAvailable, true),
      bufferMinutes: body.bufferMinutes !== undefined ? ensureNumber(body.bufferMinutes, "availabilityRule.bufferMinutes") : undefined,
      capacity: body.capacity !== undefined ? ensureNumber(body.capacity, "availabilityRule.capacity") : undefined,
      reason: optionalString(body.reason),
      timezone: ensureString(body.timezone, "availabilityRule.timezone", "UTC"),
      recurring: ensureBoolean(body.recurring, false),
      recurrenceRule: optionalString(body.recurrenceRule),
      status: ensureEnum(body.status, "availabilityRule.status", ["active", "inactive", "archived", "draft"], "active"),
      metadata: optionalObject(body.metadata)
    };
    state.availabilityRules.push(rule);
    this.store.save();
    this.store.audit(actor, "availability.create", "availabilityRule", rule.id, undefined, rule);
    return rule;
  }

  getAvailability(actor: RequestActor, query?: URLSearchParams): { date: string; slots: Array<{ startTime: string; endTime: string; available: boolean }> }[] {
    const targetType = pickQuery(query, "targetType") ?? "user";
    const targetId = pickQuery(query, "targetId");
    const from = pickQuery(query, "from") ?? new Date().toISOString().split("T")[0];
    const to = pickQuery(query, "to") ?? plusDays(7).split("T")[0];
    const duration = pickNumberQuery(query, "duration", 30) ?? 30;
    const rules = this.store.getState().availabilityRules.filter(r =>
      r.tenantId === actor.tenantId &&
      r.targetType === targetType &&
      (r.targetId === targetId || !r.targetId) &&
      r.status === "active" &&
      r.isAvailable
    );
    const bookings = this.store.getState().bookings.filter(b =>
      b.tenantId === actor.tenantId &&
      b.status !== "cancelled" &&
      b.startTime >= from &&
      b.startTime <= to
    );
    const result: { date: string; slots: Array<{ startTime: string; endTime: string; available: boolean }> }[] = [];
    const current = new Date(from);
    const endDate = new Date(to);
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      const dayOfWeek = current.getUTCDay();
      const dayRules = rules.filter(r => !r.dayOfWeek || r.dayOfWeek.includes(dayOfWeek));
      const slots: Array<{ startTime: string; endTime: string; available: boolean }> = [];
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += duration) {
          const slotStart = new Date(current);
          slotStart.setUTCHours(hour, minute, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + duration);
          const hasConflict = bookings.some(b =>
            b.startTime < slotEnd.toISOString() &&
            b.endTime > slotStart.toISOString()
          );
          const dayRule = dayRules.find(r => {
            if (r.startTime && r.endTime) {
              const ruleStart = `${dateStr}T${r.startTime}:00.000Z`;
              const ruleEnd = `${dateStr}T${r.endTime}:00.000Z`;
              return slotStart >= new Date(ruleStart) && slotEnd <= new Date(ruleEnd);
            }
            return true;
          });
          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            available: !hasConflict && (!dayRule || dayRule.isAvailable)
          });
        }
      }
      result.push({ date: dateStr, slots });
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return result;
  }

  listReminders(actor: RequestActor, query?: URLSearchParams): Reminder[] {
    const status = pickQuery(query, "status");
    const scheduleId = pickQuery(query, "scheduleId");
    const appointmentId = pickQuery(query, "appointmentId");
    const bookingId = pickQuery(query, "bookingId");
    return this.store.getState().reminders.filter(r => {
      if (r.tenantId !== actor.tenantId) return false;
      if (status && r.status !== status) return false;
      if (scheduleId && r.scheduleId !== scheduleId) return false;
      if (appointmentId && r.appointmentId !== appointmentId) return false;
      if (bookingId && r.bookingId !== bookingId) return false;
      return true;
    });
  }

  createReminder(input: unknown, actor: RequestActor): Reminder {
    const body = ensureObject(input, "reminder");
    const state = this.store.getState();
    const reminder: Reminder = {
      id: newId("rem"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      scheduleId: optionalString(body.scheduleId),
      appointmentId: optionalString(body.appointmentId),
      bookingId: optionalString(body.bookingId),
      title: ensureString(body.title, "reminder.title"),
      message: ensureString(body.message, "reminder.message"),
      timing: ensureEnum(body.timing, "reminder.timing", ["immediately", "5min", "15min", "30min", "1hour", "1day", "3days", "1week", "custom"], "15min"),
      scheduledFor: ensureString(body.scheduledFor, "reminder.scheduledFor"),
      status: "pending",
      sentAt: undefined,
      recipientIds: ensureArray(body.recipientIds, "reminder.recipientIds"),
      channels: ensureArray(body.channels, "reminder.channels", ["email"]),
      templateId: optionalString(body.templateId),
      metadata: optionalObject(body.metadata)
    };
    state.reminders.push(reminder);
    this.store.save();
    this.store.audit(actor, "reminder.create", "reminder", reminder.id, undefined, reminder);
    return reminder;
  }

  listDeadlines(actor: RequestActor, query?: URLSearchParams): Deadline[] {
    const status = pickQuery(query, "status");
    const priority = pickQuery(query, "priority");
    const ownerId = pickQuery(query, "ownerId");
    return this.store.getState().deadlines.filter(d => {
      if (d.tenantId !== actor.tenantId) return false;
      if (status && d.status !== status) return false;
      if (priority && d.priority !== priority) return false;
      if (ownerId && d.ownerId !== ownerId) return false;
      return true;
    });
  }

  createDeadline(input: unknown, actor: RequestActor): Deadline {
    const body = ensureObject(input, "deadline");
    const state = this.store.getState();
    const deadline: Deadline = {
      id: newId("dead"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: ensureString(body.title, "deadline.title"),
      description: optionalString(body.description),
      status: "upcoming",
      dueDate: ensureString(body.dueDate, "deadline.dueDate"),
      ownerId: optionalString(body.ownerId),
      assigneeId: optionalString(body.assigneeId),
      priority: ensureEnum(body.priority, "deadline.priority", ["low", "medium", "high", "critical"], "medium"),
      category: optionalString(body.category),
      scheduleId: optionalString(body.scheduleId),
      reminderIds: [],
      metadata: optionalObject(body.metadata)
    };
    state.deadlines.push(deadline);
    this.store.save();
    this.store.audit(actor, "deadline.create", "deadline", deadline.id, undefined, deadline);
    return deadline;
  }

  listBookingPages(actor: RequestActor, query?: URLSearchParams): BookingPage[] {
    const status = pickQuery(query, "status");
    const ownerId = pickQuery(query, "ownerId");
    return this.store.getState().bookingPages.filter(bp => {
      if (bp.tenantId !== actor.tenantId) return false;
      if (status && bp.status !== status) return false;
      if (ownerId && bp.ownerId !== ownerId) return false;
      return true;
    });
  }

  createBookingPage(input: unknown, actor: RequestActor): BookingPage {
    const body = ensureObject(input, "bookingPage");
    const state = this.store.getState();
    const slug = ensureString(body.slug, "bookingPage.slug");
    if (state.bookingPages.some(bp => bp.tenantId === actor.tenantId && bp.slug === slug)) {
      conflict("Booking page slug already exists");
    }
    const page: BookingPage = {
      id: newId("bpage"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "bookingPage.name"),
      slug,
      description: optionalString(body.description),
      ownerId: optionalString(body.ownerId),
      calendarId: optionalString(body.calendarId),
      status: ensureEnum(body.status, "bookingPage.status", ["active", "inactive", "archived"], "active"),
      services: ensureArray(body.services, "bookingPage.services", []),
      availableDays: ensureArray<number>(body.availableDays, "bookingPage.availableDays", [1, 2, 3, 4, 5]),
      startHour: ensureNumber(body.startHour, "bookingPage.startHour", 9),
      endHour: ensureNumber(body.endHour, "bookingPage.endHour", 18),
      timezone: ensureString(body.timezone, "bookingPage.timezone", "UTC"),
      bufferMinutes: ensureNumber(body.bufferMinutes, "bookingPage.bufferMinutes", 0),
      maxBookingsPerSlot: ensureNumber(body.maxBookingsPerSlot, "bookingPage.maxBookingsPerSlot", 1),
      requiresApproval: ensureBoolean(body.requiresApproval, false),
      meetingLinkEnabled: ensureBoolean(body.meetingLinkEnabled, true),
      cancellationPolicy: optionalString(body.cancellationPolicy),
      metadata: optionalObject(body.metadata)
    };
    state.bookingPages.push(page);
    this.store.save();
    this.store.audit(actor, "bookingpage.create", "bookingPage", page.id, undefined, page);
    return page;
  }

  listScheduleTemplates(actor: RequestActor): ScheduleTemplate[] {
    return this.store.getState().scheduleTemplates.filter(t => t.tenantId === actor.tenantId);
  }

  createScheduleTemplate(input: unknown, actor: RequestActor): ScheduleTemplate {
    const body = ensureObject(input, "scheduleTemplate");
    const state = this.store.getState();
    const template: ScheduleTemplate = {
      id: newId("stpl"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "scheduleTemplate.name"),
      description: optionalString(body.description),
      type: ensureEnum(body.type, "scheduleTemplate.type", ["meeting", "appointment", "class", "event", "shift", "recurring"], "meeting"),
      durationMinutes: ensureNumber(body.durationMinutes, "scheduleTemplate.durationMinutes", 30),
      bufferMinutes: ensureNumber(body.bufferMinutes, "scheduleTemplate.bufferMinutes", 0),
      ownerId: optionalString(body.ownerId),
      timezone: ensureString(body.timezone, "scheduleTemplate.timezone", "UTC"),
      defaultLocation: optionalString(body.defaultLocation),
      defaultMeetingLink: optionalString(body.defaultMeetingLink),
      defaultAttendeeIds: ensureArray(body.defaultAttendeeIds, "scheduleTemplate.defaultAttendeeIds"),
      reminderTimings: ensureArray(body.reminderTimings, "scheduleTemplate.reminderTimings", ["15min", "1hour"]),
      metadata: optionalObject(body.metadata)
    };
    state.scheduleTemplates.push(template);
    this.store.save();
    this.store.audit(actor, "scheduletemplate.create", "scheduleTemplate", template.id, undefined, template);
    return template;
  }

  listWaitlistEntries(actor: RequestActor, query?: URLSearchParams): WaitlistEntry[] {
    const status = pickQuery(query, "status");
    return this.store.getState().waitlistEntries.filter(w => {
      if (w.tenantId !== actor.tenantId) return false;
      if (status && w.status !== status) return false;
      return true;
    });
  }

  addToWaitlist(input: unknown, actor: RequestActor): WaitlistEntry {
    const body = ensureObject(input, "waitlistEntry");
    const state = this.store.getState();
    const entry: WaitlistEntry = {
      id: newId("waitl"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      bookingPageId: optionalString(body.bookingPageId),
      serviceType: ensureString(body.serviceType, "waitlistEntry.serviceType"),
      customerName: ensureString(body.customerName, "waitlistEntry.customerName"),
      customerEmail: optionalString(body.customerEmail),
      customerPhone: optionalString(body.customerPhone),
      preferredDates: ensureArray(body.preferredDates, "waitlistEntry.preferredDates"),
      preferredTimeSlots: ensureArray(body.preferredTimeSlots, "waitlistEntry.preferredTimeSlots"),
      status: "waiting",
      priority: ensureEnum(body.priority, "waitlistEntry.priority", ["normal", "high", "low"], "normal"),
      offeredSlotId: undefined,
      offeredUntil: undefined,
      metadata: optionalObject(body.metadata)
    };
    state.waitlistEntries.push(entry);
    this.store.save();
    this.store.audit(actor, "waitlist.add", "waitlistEntry", entry.id, undefined, entry);
    return entry;
  }

  listEvents(actor: RequestActor, query?: URLSearchParams): SchedulingEvent[] {
    const type = pickQuery(query, "type");
    const from = pickQuery(query, "from");
    const to = pickQuery(query, "to");
    return this.store.getState().events.filter(e => {
      if (e.tenantId !== actor.tenantId) return false;
      if (type && e.type !== type) return false;
      if (from && e.createdAt < from) return false;
      if (to && e.createdAt > to) return false;
      return true;
    });
  }

  listAuditLogs(actor: RequestActor): any[] {
    return this.store.getState().auditLogs.filter(a => a.tenantId === actor.tenantId);
  }

  getAnalytics(actor: RequestActor, query?: URLSearchParams): Record<string, unknown> {
    const from = pickQuery(query, "from") ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const to = pickQuery(query, "to") ?? nowIso();
    const state = this.store.getState();
    const bookings = state.bookings.filter(b => b.tenantId === actor.tenantId && b.createdAt >= from && b.createdAt <= to);
    const appointments = state.appointments.filter(a => a.tenantId === actor.tenantId && a.createdAt >= from && a.createdAt <= to);
    const schedules = state.schedules.filter(s => s.tenantId === actor.tenantId && s.createdAt >= from && s.createdAt <= to);
    return {
      period: { from, to },
      bookings: {
        total: bookings.length,
        byStatus: countBy(bookings, "status"),
        byServiceType: countBy(bookings, "serviceType")
      },
      appointments: {
        total: appointments.length,
        byType: countBy(appointments, "type"),
        byStatus: countBy(appointments, "status")
      },
      schedules: {
        total: schedules.length,
        byType: countBy(schedules, "type"),
        byStatus: countBy(schedules, "status")
      }
    };
  }

  private checkScheduleConflict(tenantId: string, startTime: string, endTime: string, calendarId?: string, excludeId?: string): boolean {
    const schedules = this.store.getState().schedules.filter(s =>
      s.tenantId === tenantId &&
      (calendarId ? s.calendarId === calendarId : true) &&
      s.id !== excludeId &&
      s.status !== "cancelled" &&
      s.startTime < endTime &&
      s.endTime > startTime
    );
    const bookings = this.store.getState().bookings.filter(b =>
      b.tenantId === tenantId &&
      b.status !== "cancelled" &&
      b.startTime < endTime &&
      b.endTime > startTime
    );
    return schedules.length > 0 || bookings.length > 0;
  }

  private emitEvent(actor: RequestActor, type: SchedulingEventType, data: Record<string, unknown>): SchedulingEvent {
    const state = this.store.getState();
    const event: SchedulingEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "SchedulingOS",
      data,
      correlationId: undefined
    };
    state.events.unshift(event);
    this.store.save();
    return event;
  }
}
