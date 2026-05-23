import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router, permissionsFor } from "./core/http";
import { docs } from "./docs";
import { CommunicationService } from "./service";
import { createSeedState } from "./seed-state";

const port = Number(process.env.PORT ?? 10900);
const dbFile = process.env.COMMUNICATIONOS_DB_FILE ?? "data/communicationos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().channels.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new CommunicationService(store);
const router = new Router();

router.get("/health", () => ({ service: "CommunicationOS", status: "ok", message: service.getRoutesSummary() }));
router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

router.get("/communicationos/overview", ({ actor }) => service.overview(actor), "communication.overview.view");

router.get("/communicationos/channels", ({ actor }) => service.listChannels(actor), "communication.channel.read");
router.post("/communicationos/channels", ({ body, actor }) => service.createChannel(body, actor), "communication.channel.write");

router.get("/communicationos/contacts", ({ actor, query }) => service.listContacts(actor, query), "communication.message.read");
router.post("/communicationos/contacts", ({ body, actor }) => service.createContact(body, actor), "communication.message.write");

router.get("/communicationos/conversations", ({ actor, query }) => service.listConversations(actor, query), "communication.conversation.read");
router.post("/communicationos/conversations", ({ body, actor }) => service.createConversation(body, actor), "communication.conversation.write");
router.get("/communicationos/conversations/:id", ({ params, actor }) => service.getConversation(params.id, actor), "communication.conversation.read");
router.patch("/communicationos/conversations/:id", ({ params, body, actor }) => service.updateConversation(params.id, body, actor), "communication.conversation.write");

router.get("/communicationos/messages", ({ actor, query }) => service.listMessages(actor, query), "communication.message.read");
router.post("/communicationos/messages", ({ body, actor }) => service.createMessage(body, actor), "communication.message.write");

router.get("/communicationos/templates", ({ actor }) => service.listMessageTemplates(actor), "communication.message.read");
router.post("/communicationos/templates", ({ body, actor }) => service.createMessageTemplate(body, actor), "communication.message.write");

router.get("/communicationos/calls", ({ actor, query }) => service.listCalls(actor, query), "communication.call.read");
router.post("/communicationos/calls", ({ body, actor }) => service.createCall(body, actor), "communication.call.write");
router.patch("/communicationos/calls/:id", ({ params, body, actor }) => service.updateCall(params.id, body, actor), "communication.call.write");

router.get("/communicationos/conferences", ({ actor }) => service.listConferences(actor), "communication.call.read");
router.post("/communicationos/conferences", ({ body, actor }) => service.createConference(body, actor), "communication.call.write");

router.get("/communicationos/presence", ({ actor }) => service.listPresences(actor), "communication.message.read");
router.patch("/communicationos/presence/:userId", ({ params, body, actor }) => service.updatePresence(params.userId, body, actor), "communication.message.write");

router.get("/communicationos/announcements", ({ actor }) => service.listAnnouncements(actor), "communication.message.read");
router.post("/communicationos/announcements", ({ body, actor }) => service.createAnnouncement(body, actor), "communication.message.write");

router.get("/communicationos/search", ({ actor, query }) => {
  const q = query?.get("q") ?? "";
  return service.searchMessages(actor, q);
}, "communication.message.read");

router.get("/communicationos/audit", ({ actor }) => service.listAuditLogs(actor), "communication.audit.read");

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`CommunicationOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
