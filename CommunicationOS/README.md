# CommunicationOS

CommunicationOS is the communication, messaging, inbox, email, chat, WhatsApp, calling, meeting, announcements, and collaboration layer of the APPNEURAL ecosystem.

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the service
npm start

# Or for development
npm run dev
```

## Environment Variables

- `PORT` - Server port (default: 10900)
- `COMMUNICATIONOS_DB_FILE` - Path to JSON database file (default: data/communicationos.db.json)
- `DEFAULT_TENANT_ID` - Default tenant ID (default: demo-tenant)

## API Endpoints

### Health & Documentation
- `GET /health` - Health check
- `GET /docs` - API documentation
- `GET /permissions` - Permissions for current role

### Overview
- `GET /communicationos/overview` - Communication overview and metrics

### Channels
- `GET /communicationos/channels` - List all channels
- `POST /communicationos/channels` - Create a new channel

### Contacts
- `GET /communicationos/contacts` - List contacts (supports `?search=`)
- `POST /communicationos/contacts` - Create a new contact

### Conversations
- `GET /communicationos/conversations` - List conversations (supports filters)
- `POST /communicationos/conversations` - Create a new conversation
- `GET /communicationos/conversations/:id` - Get conversation with messages
- `PATCH /communicationos/conversations/:id` - Update conversation

### Messages
- `GET /communicationos/messages` - List messages (supports filters)
- `POST /communicationos/messages` - Send a message

### Templates
- `GET /communicationos/templates` - List message templates
- `POST /communicationos/templates` - Create a message template

### Calls
- `GET /communicationos/calls` - List calls (supports `?status=`)
- `POST /communicationos/calls` - Start a call
- `PATCH /communicationos/calls/:id` - Update call status

### Conferences
- `GET /communicationos/conferences` - List conferences
- `POST /communicationos/conferences` - Schedule a conference

### Presence
- `GET /communicationos/presence` - List user presences
- `PATCH /communicationos/presence/:userId` - Update user presence

### Announcements
- `GET /communicationos/announcements` - List announcements
- `POST /communicationos/announcements` - Create an announcement

### Search & Audit
- `GET /communicationos/search?q=` - Search messages
- `GET /communicationos/audit` - View audit logs

## Authentication

Use headers to specify user context:
- `x-role` - User role (owner, admin, communication_admin, communication_manager, communication_agent, viewer)
- `x-tenant-id` - Tenant ID (defaults to demo-tenant)
- `x-user-id` - User ID

## Example Requests

### Create a Conversation
```bash
curl -X POST http://localhost:10900/communicationos/conversations \
  -H "Content-Type: application/json" \
  -H "x-role: communication_agent" \
  -d '{
    "channelId": "channel_email",
    "title": "New Sales Lead",
    "type": "sales",
    "contactId": "contact_john",
    "priority": "high"
  }'
```

### Send a Message
```bash
curl -X POST http://localhost:10900/communicationos/messages \
  -H "Content-Type: application/json" \
  -H "x-role: communication_agent" \
  -d '{
    "conversationId": "conv_sales_lead",
    "channelId": "channel_email",
    "content": "Hello, thank you for your interest!",
    "direction": "outbound"
  }'
```

### Get Communication Overview
```bash
curl http://localhost:10900/communicationos/overview \
  -H "x-role: communication_manager"
```

## Core Entities

- **Contact** - People or entities that can be contacted
- **Channel** - Communication mediums (email, WhatsApp, SMS, chat, internal)
- **Conversation** - Threaded discussions between participants
- **Message** - Individual units of communication
- **Call** - Voice or video communication sessions
- **Conference** - Scheduled meetings with multiple participants
- **Presence** - Real-time user status (online, away, busy, offline)
- **Announcement** - Broadcast messages to users

## License

MIT
## Related OSs

- platformos
- securityos
