export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "scheduler" | "scheduler_manager" | "viewer";
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

export interface Calendar extends BaseEntity {
  name: string;
  description?: string;
  ownerId?: UUID;
  type: "personal" | "team" | "resource" | "public" | "booking";
  timezone: string;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export type ScheduleType = "meeting" | "appointment" | "class" | "event" | "task" | "reminder" | "deadline" | "booking" | "shift" | "block";

export interface Schedule extends BaseEntity {
  calendarId?: UUID;
  title: string;
  description?: string;
  type: ScheduleType;
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  startTime: ISODate;
  endTime: ISODate;
  durationMinutes: number;
  timezone: string;
  location?: string;
  meetingLink?: string;
  ownerId?: UUID;
  attendeeIds: UUID[];
  resourceIds: UUID[];
  bookingId?: UUID;
  parentRecurringId?: UUID;
  reminderIds: UUID[];
  metadata: Record<string, unknown>;
}

export type AppointmentType = "consultation" | "demo" | "interview" | "support" | "service" | "medical" | "coaching" | "inspection";
export type AppointmentStatus = "requested" | "confirmed" | "rescheduled" | "cancelled" | "completed" | "no_show" | "pending_approval";

export interface Appointment extends BaseEntity {
  title: string;
  description?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  calendarId?: UUID;
  scheduleId?: UUID;
  startTime: ISODate;
  endTime: ISODate;
  durationMinutes: number;
  timezone: string;
  clientId?: UUID;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  hostId?: UUID;
  hostName: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  bookingId?: UUID;
  reminderIds: UUID[];
  metadata: Record<string, unknown>;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "rescheduled" | "completed" | "no_show" | "no_refund" | "refunded";

export interface Booking extends BaseEntity {
  title: string;
  description?: string;
  status: BookingStatus;
  calendarId?: UUID;
  scheduleId?: UUID;
  startTime: ISODate;
  endTime: ISODate;
  durationMinutes: number;
  timezone: string;
  serviceType: string;
  customerId?: UUID;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  hostId?: UUID;
  hostName: string;
  location?: string;
  meetingLink?: string;
  resourceIds: UUID[];
  quantity: number;
  price?: number;
  currency?: string;
  paymentStatus?: "pending" | "paid" | "refunded" | "failed";
  paymentLink?: string;
  reminderIds: UUID[];
  cancellationReason?: string;
  rescheduleReason?: string;
  metadata: Record<string, unknown>;
}

export interface TimeSlot extends BaseEntity {
  calendarId?: UUID;
  title: string;
  startTime: ISODate;
  endTime: ISODate;
  durationMinutes: number;
  bufferMinutes: number;
  capacity: number;
  bookedCount: number;
  status: "available" | "limited" | "full" | "blocked";
  serviceType?: string;
  ownerId?: UUID;
  hostId?: UUID;
  location?: string;
  requiresApproval: boolean;
  metadata: Record<string, unknown>;
}

export type AvailabilityType = "working_hours" | "blocked" | "leave" | "busy" | "custom";

export interface AvailabilityRule extends BaseEntity {
  name: string;
  ownerId?: UUID;
  targetType: "user" | "resource" | "room" | "trainer" | "team";
  targetId?: UUID;
  type: AvailabilityType;
  dayOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  dateFrom?: ISODate;
  dateTo?: ISODate;
  isAvailable: boolean;
  bufferMinutes?: number;
  capacity?: number;
  reason?: string;
  timezone: string;
  recurring: boolean;
  recurrenceRule?: string;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export type ReminderTiming = "immediately" | "5min" | "15min" | "30min" | "1hour" | "1day" | "3days" | "1week" | "custom";
export type ReminderStatus = "pending" | "sent" | "cancelled" | "failed";
export type ReminderChannel = "email" | "sms" | "push" | "in_app";

export interface Reminder extends BaseEntity {
  scheduleId?: UUID;
  appointmentId?: UUID;
  bookingId?: UUID;
  title: string;
  message: string;
  timing: ReminderTiming;
  scheduledFor: ISODate;
  status: ReminderStatus;
  sentAt?: ISODate;
  recipientIds: UUID[];
  channels: ReminderChannel[];
  templateId?: string;
  metadata: Record<string, unknown>;
}

export type DeadlineStatus = "upcoming" | "due_today" | "overdue" | "completed" | "extended" | "escalated" | "cancelled";

export interface Deadline extends BaseEntity {
  title: string;
  description?: string;
  status: DeadlineStatus;
  dueDate: ISODate;
  ownerId?: UUID;
  assigneeId?: UUID;
  priority: "low" | "medium" | "high" | "critical";
  category?: string;
  scheduleId?: UUID;
  reminderIds: UUID[];
  metadata: Record<string, unknown>;
}

export type BookingPageStatus = "active" | "inactive" | "archived";

export interface BookingPage extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  ownerId?: UUID;
  calendarId?: UUID;
  status: BookingPageStatus;
  services: Array<{
    name: string;
    durationMinutes: number;
    price?: number;
    description?: string;
  }>;
  availableDays: number[];
  startHour: number;
  endHour: number;
  timezone: string;
  bufferMinutes: number;
  maxBookingsPerSlot: number;
  requiresApproval: boolean;
  meetingLinkEnabled: boolean;
  cancellationPolicy?: string;
  metadata: Record<string, unknown>;
}

export type WaitlistStatus = "waiting" | "offered" | "converted" | "expired" | "cancelled";
export type WaitlistPriority = "normal" | "high" | "low";

export interface WaitlistEntry extends BaseEntity {
  bookingPageId?: UUID;
  serviceType: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  preferredDates: ISODate[];
  preferredTimeSlots: string[];
  status: WaitlistStatus;
  priority: WaitlistPriority;
  offeredSlotId?: UUID;
  offeredUntil?: ISODate;
  metadata: Record<string, unknown>;
}

export interface ScheduleTemplate extends BaseEntity {
  name: string;
  description?: string;
  type: "meeting" | "appointment" | "class" | "event" | "shift" | "recurring";
  durationMinutes: number;
  bufferMinutes: number;
  ownerId?: UUID;
  timezone: string;
  defaultLocation?: string;
  defaultMeetingLink?: string;
  defaultAttendeeIds: UUID[];
  reminderTimings: ReminderTiming[];
  metadata: Record<string, unknown>;
}

export type SchedulingEventType =
  | "booking.created"
  | "booking.confirmed"
  | "booking.cancelled"
  | "booking.rescheduled"
  | "appointment.scheduled"
  | "appointment.confirmed"
  | "appointment.cancelled"
  | "reminder.due"
  | "reminder.sent"
  | "schedule.conflict"
  | "slot.full"
  | "deadline.overdue"
  | "slot.available"
  | "waitlist.promoted"
  | "scheduling.seeded";

export interface SchedulingEvent extends BaseEntity {
  type: SchedulingEventType;
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

export interface SchedulingOverview {
  calendars: number;
  schedules: { total: number; upcoming: number; completed: number; cancelled: number };
  appointments: { total: number; upcoming: number; completed: number; noShow: number };
  bookings: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
  timeSlots: { total: number; available: number; booked: number };
  reminders: { total: number; pending: number; sent: number };
  deadlines: { total: number; upcoming: number; overdue: number };
}

export interface SchedulingState {
  calendars: Calendar[];
  schedules: Schedule[];
  appointments: Appointment[];
  bookings: Booking[];
  timeSlots: TimeSlot[];
  availabilityRules: AvailabilityRule[];
  reminders: Reminder[];
  deadlines: Deadline[];
  bookingPages: BookingPage[];
  waitlistEntries: WaitlistEntry[];
  scheduleTemplates: ScheduleTemplate[];
  events: SchedulingEvent[];
  auditLogs: AuditLog[];
}
