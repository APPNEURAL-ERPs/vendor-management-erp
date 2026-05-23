import { SchedulingState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, plusDays } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): SchedulingState {
  const state = emptyState();
  const createdAt = nowIso();
  const tomorrow = plusDays(1);
  const nextWeek = plusDays(7);
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayIso = yesterday.toISOString();

  state.calendars.push(
    {
      id: "cal_main",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Main Calendar",
      description: "Primary calendar for team scheduling",
      ownerId: "user_admin",
      type: "team",
      timezone: "UTC",
      status: "active",
      metadata: {}
    },
    {
      id: "cal_consultations",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Consultation Calendar",
      description: "Calendar for client consultations and demos",
      ownerId: "user_sales",
      type: "booking",
      timezone: "UTC",
      status: "active",
      metadata: {}
    },
    {
      id: "cal_training",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Training Calendar",
      description: "Calendar for training sessions and classes",
      ownerId: "user_trainer",
      type: "team",
      timezone: "UTC",
      status: "active",
      metadata: {}
    }
  );

  state.schedules.push(
    {
      id: "sched_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      calendarId: "cal_main",
      title: "Weekly Team Standup",
      description: "Regular team sync meeting",
      type: "meeting",
      status: "confirmed",
      startTime: tomorrow.replace("T00:00:00.000Z", "T09:00:00.000Z"),
      endTime: tomorrow.replace("T00:00:00.000Z", "T09:30:00.000Z"),
      durationMinutes: 30,
      timezone: "UTC",
      location: "Conference Room A",
      meetingLink: "https://meet.example.com/standup",
      ownerId: "user_admin",
      attendeeIds: ["user_admin", "user_sales", "user_support"],
      resourceIds: [],
      reminderIds: [],
      metadata: { recurring: "weekly", day: "monday" }
    },
    {
      id: "sched_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      calendarId: "cal_main",
      title: "Product Roadmap Review",
      description: "Quarterly product review meeting",
      type: "meeting",
      status: "scheduled",
      startTime: nextWeek.replace("T00:00:00.000Z", "T14:00:00.000Z"),
      endTime: nextWeek.replace("T00:00:00.000Z", "T16:00:00.000Z"),
      durationMinutes: 120,
      timezone: "UTC",
      location: "Main Boardroom",
      ownerId: "user_admin",
      attendeeIds: ["user_admin", "user_sales"],
      resourceIds: [],
      reminderIds: [],
      metadata: {}
    },
    {
      id: "sched_past",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      calendarId: "cal_main",
      title: "Completed Meeting",
      description: "This meeting has been completed",
      type: "meeting",
      status: "completed",
      startTime: yesterdayIso.replace("00:00:00.000Z", "T10:00:00.000Z"),
      endTime: yesterdayIso.replace("00:00:00.000Z", "T11:00:00.000Z"),
      durationMinutes: 60,
      timezone: "UTC",
      ownerId: "user_sales",
      attendeeIds: ["user_sales", "user_support"],
      resourceIds: [],
      reminderIds: [],
      metadata: {}
    }
  );

  state.appointments.push(
    {
      id: "appt_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "AI Automation Demo",
      description: "Product demo for enterprise client",
      type: "demo",
      status: "confirmed",
      calendarId: "cal_consultations",
      startTime: tomorrow.replace("T00:00:00.000Z", "T11:00:00.000Z"),
      endTime: tomorrow.replace("T00:00:00.000Z", "T12:00:00.000Z"),
      durationMinutes: 60,
      timezone: "UTC",
      clientId: "client_abc",
      clientName: "ABC Technologies",
      clientEmail: "contact@abctech.com",
      hostId: "user_sales",
      hostName: "Sales Team",
      location: "Virtual",
      meetingLink: "https://meet.example.com/demo-abc",
      reminderIds: [],
      metadata: { source: "website", converted: true }
    },
    {
      id: "appt_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Career Consultation",
      description: "Career guidance session",
      type: "consultation",
      status: "requested",
      startTime: nextWeek.replace("T00:00:00.000Z", "T15:00:00.000Z"),
      endTime: nextWeek.replace("T00:00:00.000Z", "T16:00:00.000Z"),
      durationMinutes: 60,
      timezone: "UTC",
      clientId: "client_john",
      clientName: "John Doe",
      clientEmail: "john@example.com",
      hostId: "user_trainer",
      hostName: "Career Coach",
      meetingLink: "https://meet.example.com/career-john",
      reminderIds: [],
      metadata: {}
    },
    {
      id: "appt_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Technical Interview",
      description: "Senior developer interview",
      type: "interview",
      status: "confirmed",
      startTime: nextWeek.replace("T00:00:00.000Z", "T10:00:00.000Z"),
      endTime: nextWeek.replace("T00:00:00.000Z", "T12:00:00.000Z"),
      durationMinutes: 120,
      timezone: "UTC",
      clientName: "Jane Smith",
      clientEmail: "jane@careers.com",
      hostId: "user_hr",
      hostName: "HR Team",
      reminderIds: [],
      metadata: { position: "Senior Developer", rounds: 2 }
    }
  );

  state.bookings.push(
    {
      id: "book_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Premium Consultation",
      description: "1-hour premium consultation session",
      status: "confirmed",
      calendarId: "cal_consultations",
      startTime: tomorrow.replace("T00:00:00.000Z", "T14:00:00.000Z"),
      endTime: tomorrow.replace("T00:00:00.000Z", "T15:00:00.000Z"),
      durationMinutes: 60,
      timezone: "UTC",
      serviceType: "premium-consultation",
      customerId: "customer_xyz",
      customerName: "XYZ Corporation",
      customerEmail: "bookings@xyzcorp.com",
      hostId: "user_sales",
      hostName: "Senior Consultant",
      meetingLink: "https://meet.example.com/xyz-premium",
      resourceIds: [],
      quantity: 1,
      price: 299.99,
      currency: "USD",
      paymentStatus: "paid",
      reminderIds: [],
      metadata: {}
    },
    {
      id: "book_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Training Session",
      description: "Team training on new platform",
      status: "pending",
      startTime: nextWeek.replace("T00:00:00.000Z", "T09:00:00.000Z"),
      endTime: nextWeek.replace("T00:00:00.000Z", "T12:00:00.000Z"),
      durationMinutes: 180,
      timezone: "UTC",
      serviceType: "training",
      customerName: "Enterprise Client",
      customerEmail: "training@enterprise.com",
      hostId: "user_trainer",
      hostName: "Training Team",
      resourceIds: ["room_training"],
      quantity: 5,
      price: 999.99,
      currency: "USD",
      paymentStatus: "pending",
      reminderIds: [],
      metadata: { batch: "Q2-2026", attendees: 25 }
    },
    {
      id: "book_completed",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Completed Booking",
      status: "completed",
      startTime: yesterdayIso.replace("00:00:00.000Z", "T13:00:00.000Z"),
      endTime: yesterdayIso.replace("00:00:00.000Z", "T14:00:00.000Z"),
      durationMinutes: 60,
      timezone: "UTC",
      serviceType: "consultation",
      customerName: "Previous Client",
      customerEmail: "client@past.com",
      hostId: "user_support",
      hostName: "Support Team",
      resourceIds: [],
      quantity: 1,
      paymentStatus: "paid",
      reminderIds: [],
      metadata: {}
    }
  );

  state.timeSlots.push(
    {
      id: "slot_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      calendarId: "cal_consultations",
      title: "Morning Consultation Slot",
      startTime: tomorrow.replace("T00:00:00.000Z", "T09:00:00.000Z"),
      endTime: tomorrow.replace("T00:00:00.000Z", "T09:30:00.000Z"),
      durationMinutes: 30,
      bufferMinutes: 5,
      capacity: 1,
      bookedCount: 0,
      status: "available",
      serviceType: "consultation",
      ownerId: "user_sales",
      hostId: "user_sales",
      requiresApproval: false,
      metadata: {}
    },
    {
      id: "slot_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      calendarId: "cal_consultations",
      title: "Afternoon Demo Slot",
      startTime: tomorrow.replace("T00:00:00.000Z", "T14:00:00.000Z"),
      endTime: tomorrow.replace("T00:00:00.000Z", "T15:00:00.000Z"),
      durationMinutes: 60,
      bufferMinutes: 10,
      capacity: 3,
      bookedCount: 1,
      status: "limited",
      serviceType: "demo",
      ownerId: "user_sales",
      hostId: "user_sales",
      requiresApproval: false,
      metadata: {}
    },
    {
      id: "slot_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      calendarId: "cal_training",
      title: "Training Session Slot",
      startTime: nextWeek.replace("T00:00:00.000Z", "T10:00:00.000Z"),
      endTime: nextWeek.replace("T00:00:00.000Z", "T13:00:00.000Z"),
      durationMinutes: 180,
      bufferMinutes: 15,
      capacity: 20,
      bookedCount: 0,
      status: "available",
      serviceType: "training",
      ownerId: "user_trainer",
      hostId: "user_trainer",
      requiresApproval: true,
      metadata: {}
    }
  );

  state.availabilityRules.push(
    {
      id: "avail_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Standard Working Hours",
      ownerId: "user_sales",
      targetType: "user",
      targetId: "user_sales",
      type: "working_hours",
      dayOfWeek: [1, 2, 3, 4, 5],
      startTime: "09:00",
      endTime: "18:00",
      isAvailable: true,
      timezone: "UTC",
      recurring: true,
      status: "active",
      metadata: {}
    },
    {
      id: "avail_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Weekend Block",
      ownerId: "user_admin",
      targetType: "team",
      type: "blocked",
      dayOfWeek: [0, 6],
      isAvailable: false,
      reason: "Weekends are non-working days",
      timezone: "UTC",
      recurring: true,
      status: "active",
      metadata: {}
    },
    {
      id: "avail_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Conference Room A Availability",
      targetType: "room",
      targetId: "room_conference_a",
      type: "working_hours",
      dayOfWeek: [1, 2, 3, 4, 5],
      startTime: "08:00",
      endTime: "20:00",
      isAvailable: true,
      bufferMinutes: 15,
      capacity: 10,
      timezone: "UTC",
      recurring: true,
      status: "active",
      metadata: {}
    }
  );

  state.reminders.push(
    {
      id: "rem_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      appointmentId: "appt_1",
      title: "AI Automation Demo Reminder",
      message: "Your demo with ABC Technologies starts in 1 hour",
      timing: "1hour",
      scheduledFor: tomorrow.replace("T00:00:00.000Z", "T10:00:00.000Z"),
      status: "pending",
      recipientIds: ["user_sales", "client_abc"],
      channels: ["email", "in_app"],
      metadata: {}
    },
    {
      id: "rem_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      bookingId: "book_1",
      title: "Premium Consultation Reminder",
      message: "Your consultation session starts tomorrow",
      timing: "1day",
      scheduledFor: new Date(new Date(tomorrow).getTime() - 24 * 60 * 60 * 1000).toISOString(),
      status: "sent",
      sentAt: createdAt,
      recipientIds: ["user_sales", "customer_xyz"],
      channels: ["email"],
      metadata: {}
    },
    {
      id: "rem_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      scheduleId: "sched_1",
      title: "Team Standup Reminder",
      message: "Weekly team standup starts in 15 minutes",
      timing: "15min",
      scheduledFor: tomorrow.replace("T00:00:00.000Z", "T08:45:00.000Z"),
      status: "pending",
      recipientIds: ["user_admin", "user_sales", "user_support"],
      channels: ["in_app"],
      metadata: {}
    }
  );

  state.deadlines.push(
    {
      id: "dead_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Q2 Product Launch",
      description: "Launch new product features",
      status: "upcoming",
      dueDate: nextWeek.replace("T00:00:00.000Z", "T17:00:00.000Z"),
      ownerId: "user_admin",
      priority: "high",
      category: "product",
      reminderIds: [],
      metadata: {}
    },
    {
      id: "dead_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Security Review",
      description: "Complete quarterly security audit",
      status: "upcoming",
      dueDate: plusDays(14).replace("T00:00:00.000Z", "T17:00:00.000Z"),
      ownerId: "user_security",
      priority: "critical",
      category: "security",
      reminderIds: [],
      metadata: {}
    }
  );

  state.bookingPages.push(
    {
      id: "bpage_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Demo Booking Page",
      slug: "book-demo",
      description: "Book a product demo with our team",
      ownerId: "user_sales",
      calendarId: "cal_consultations",
      status: "active",
      services: [
        { name: "Product Demo", durationMinutes: 45, description: "45-minute product demonstration" },
        { name: "Technical Demo", durationMinutes: 60, description: "60-minute technical deep dive", price: 99.99 },
        { name: "Enterprise Demo", durationMinutes: 90, price: 299.99, description: "90-minute comprehensive demo" }
      ],
      availableDays: [1, 2, 3, 4, 5],
      startHour: 9,
      endHour: 17,
      timezone: "UTC",
      bufferMinutes: 10,
      maxBookingsPerSlot: 2,
      requiresApproval: false,
      meetingLinkEnabled: true,
      metadata: {}
    },
    {
      id: "bpage_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Career Consultation Booking",
      slug: "career-consultation",
      description: "Book a career guidance session",
      ownerId: "user_trainer",
      status: "active",
      services: [
        { name: "Initial Consultation", durationMinutes: 30, price: 0, description: "Free initial consultation" },
        { name: "Career Planning Session", durationMinutes: 60, price: 149.99, description: "In-depth career planning" },
        { name: "Resume Review", durationMinutes: 45, price: 79.99, description: "Professional resume review" }
      ],
      availableDays: [1, 2, 4, 5, 6],
      startHour: 10,
      endHour: 19,
      timezone: "UTC",
      bufferMinutes: 5,
      maxBookingsPerSlot: 1,
      requiresApproval: true,
      meetingLinkEnabled: true,
      cancellationPolicy: "24 hours notice required for cancellation",
      metadata: {}
    }
  );

  state.scheduleTemplates.push(
    {
      id: "stpl_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Standard Meeting",
      description: "Default template for internal meetings",
      type: "meeting",
      durationMinutes: 30,
      bufferMinutes: 5,
      ownerId: "user_admin",
      timezone: "UTC",
      defaultLocation: "Conference Room",
      defaultAttendeeIds: [],
      reminderTimings: ["15min", "1hour"],
      metadata: {}
    },
    {
      id: "stpl_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Client Consultation",
      description: "Template for client consultation sessions",
      type: "appointment",
      durationMinutes: 60,
      bufferMinutes: 10,
      ownerId: "user_sales",
      timezone: "UTC",
      defaultMeetingLink: "https://meet.example.com/consultation",
      defaultAttendeeIds: [],
      reminderTimings: ["15min", "1hour", "1day"],
      metadata: { meetingLinkEnabled: true }
    },
    {
      id: "stpl_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Training Session",
      description: "Template for training sessions",
      type: "class",
      durationMinutes: 180,
      bufferMinutes: 15,
      ownerId: "user_trainer",
      timezone: "UTC",
      defaultLocation: "Training Room",
      defaultAttendeeIds: [],
      reminderTimings: ["1day", "3days", "1week"],
      metadata: {}
    }
  );

  state.waitlistEntries.push(
    {
      id: "waitl_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      bookingPageId: "bpage_2",
      serviceType: "career-planning",
      customerName: "Waiting Customer",
      customerEmail: "waiting@example.com",
      preferredDates: [tomorrow.split("T")[0], nextWeek.split("T")[0]],
      preferredTimeSlots: ["10:00", "14:00", "16:00"],
      status: "waiting",
      priority: "normal",
      metadata: {}
    }
  );

  state.events.push(
    {
      id: "evt_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "booking.created",
      source: "SchedulingOS",
      data: { bookingId: "book_1", title: "Premium Consultation", customerName: "XYZ Corporation" }
    },
    {
      id: "evt_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "appointment.scheduled",
      source: "SchedulingOS",
      data: { appointmentId: "appt_1", title: "AI Automation Demo", clientName: "ABC Technologies" }
    },
    {
      id: "evt_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "scheduling.seeded",
      source: "SchedulingOS",
      data: { message: "SchedulingOS demo data seeded" }
    }
  );

  return state;
}
