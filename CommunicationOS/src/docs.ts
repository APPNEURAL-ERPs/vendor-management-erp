export function docs() {
  return {
    name: "CommunicationOS",
    version: "1.0.0",
    description: "CommunicationOS: messaging, inbox, email, WhatsApp, chat, calls, meetings, announcements, and collaboration for APPNEURAL",
    auth: {
      headers: {
        "x-role": "owner | admin | communication_admin | communication_manager | communication_agent | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      contact: "A person or entity that can be contacted via various channels.",
      channel: "A communication medium such as email, WhatsApp, SMS, chat, or internal messaging.",
      conversation: "A threaded discussion between participants, tracked across messages.",
      message: "A single unit of communication within a conversation.",
      call: "A voice or video communication session.",
      conference: "A scheduled meeting with multiple participants.",
      presence: "Real-time status of a user (online, away, busy, offline).",
      template: "A reusable message format for consistent communication."
    },
    examples: {
      sendMessage: {
        method: "POST",
        path: "/communicationos/messages",
        headers: { "x-role": "communication_agent" },
        body: {
          conversationId: "conv_123",
          channelId: "channel_email",
          content: "Hello, this is a follow-up message.",
          direction: "outbound"
        }
      },
      createConversation: {
        method: "POST",
        path: "/communicationos/conversations",
        headers: { "x-role": "communication_agent" },
        body: {
          channelId: "channel_whatsapp",
          title: "Lead follow-up",
          type: "sales",
          contactId: "contact_456",
          priority: "high"
        }
      },
      startCall: {
        method: "POST",
        path: "/communicationos/calls",
        headers: { "x-role": "communication_agent" },
        body: {
          direction: "outbound",
          type: "voice",
          contactId: "contact_789"
        }
      },
      scheduleConference: {
        method: "POST",
        path: "/communicationos/conferences",
        headers: { "x-role": "communication_manager" },
        body: {
          name: "Team Standup",
          type: "meeting",
          scheduledStartAt: "2024-01-15T09:00:00Z",
          scheduledEndAt: "2024-01-15T09:30:00Z",
          maxParticipants: 10
        }
      }
    }
  };
}
