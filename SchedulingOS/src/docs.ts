export function docs() {
  return {
    name: "SchedulingOS",
    version: "1.0.0",
    description: "Scheduling, appointments, availability, calendars, bookings, reminders, and time-based coordination layer for APPNEURAL.",
    auth: {
      headers: {
        "x-role": "owner | admin | scheduler | scheduler_manager | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      calendar: "A collection for organizing schedules and events.",
      schedule: "A time-blocked event on a calendar with attendees and resources.",
      appointment: "A booked service slot for clients with consultants, trainers, or hosts.",
      booking: "A confirmed reservation with customer details and optional payment.",
      timeSlot: "A bookable time unit with capacity and availability status.",
      availabilityRule: "Rules defining when users, resources, or rooms are available.",
      reminder: "Scheduled notifications sent before or after events.",
      deadline: "Time-bound tasks or milestones with priority levels.",
      bookingPage: "Public booking pages for external customers to schedule appointments."
    },
    examples: {
      createBooking: {
        method: "POST",
        path: "/scheduling/bookings",
        headers: { "x-role": "scheduler" },
        body: {
          title: "AI Consultation",
          customerName: "John Doe",
          hostName: "Sarah Smith",
          serviceType: "consultation",
          startTime: "2026-05-25T10:00:00.000Z",
          endTime: "2026-05-25T11:00:00.000Z",
          durationMinutes: 60
        }
      },
      checkAvailability: {
        method: "GET",
        path: "/scheduling/availability?targetType=user&targetId=user_123&from=2026-05-25&to=2026-05-30&duration=30",
        headers: { "x-role": "scheduler" }
      },
      createAppointment: {
        method: "POST",
        path: "/scheduling/appointments",
        headers: { "x-role": "scheduler" },
        body: {
          title: "Product Demo",
          clientName: "ABC Technologies",
          hostName: "Sales Team",
          type: "demo",
          startTime: "2026-05-26T14:00:00.000Z",
          endTime: "2026-05-26T15:00:00.000Z",
          durationMinutes: 60,
          meetingLink: "https://meet.example.com/demo123"
        }
      }
    }
  };
}
