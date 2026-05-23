import { Router } from "../core/http";
import { listPermissions } from "../core/security";
import { buildDocs } from "../docs";
import { ClientService } from "../services/client.service";

export function registerRoutes(router: Router, service: ClientService): Router {
  router.get("/health", () => service.health());
  router.get("/docs", () => buildDocs(router.listRoutes()));
  router.get("/clientos/permissions", ({ actor }) => ({ role: actor.role, permissions: listPermissions(actor.role) }));
  router.get("/clientos/overview", ({ actor }) => service.overview(actor), "client.analytics.read");

  router.get("/clientos/accounts", ({ actor, query }) => service.listAccounts(actor, Object.fromEntries(query.entries())), "client.accounts.read");
  router.post("/clientos/accounts", ({ actor, body }) => service.createAccount(actor, body), "client.accounts.write");
  router.get("/clientos/accounts/:id", ({ actor, params }) => service.getAccount(actor, params.id), "client.accounts.read");
  router.patch("/clientos/accounts/:id", ({ actor, params, body }) => service.updateAccount(actor, params.id, body), "client.accounts.write");
  router.get("/clientos/accounts/:id/profile", ({ actor, params }) => service.accountProfile(actor, params.id), "client.accounts.read");

  router.get("/clientos/contacts", ({ actor, query }) => service.listContacts(actor, Object.fromEntries(query.entries())), "client.contacts.read");
  router.post("/clientos/contacts", ({ actor, body }) => service.createContact(actor, body), "client.contacts.write");
  router.get("/clientos/contacts/:id", ({ actor, params }) => service.getContact(actor, params.id), "client.contacts.read");
  router.patch("/clientos/contacts/:id", ({ actor, params, body }) => service.updateContact(actor, params.id, body), "client.contacts.write");

  router.get("/clientos/opportunities", ({ actor, query }) => service.listOpportunities(actor, Object.fromEntries(query.entries())), "client.opportunities.read");
  router.post("/clientos/opportunities", ({ actor, body }) => service.createOpportunity(actor, body), "client.opportunities.write");
  router.get("/clientos/opportunities/:id", ({ actor, params }) => service.getOpportunity(actor, params.id), "client.opportunities.read");
  router.patch("/clientos/opportunities/:id", ({ actor, params, body }) => service.updateOpportunity(actor, params.id, body), "client.opportunities.write");
  router.post("/clientos/opportunities/:id/stage", ({ actor, params, body }) => service.changeOpportunityStage(actor, params.id, body), "client.opportunities.write");

  router.get("/clientos/tickets", ({ actor, query }) => service.listTickets(actor, Object.fromEntries(query.entries())), "client.tickets.read");
  router.post("/clientos/tickets", ({ actor, body }) => service.createTicket(actor, body), "client.tickets.write");
  router.get("/clientos/tickets/:id", ({ actor, params }) => service.getTicket(actor, params.id), "client.tickets.read");
  router.patch("/clientos/tickets/:id", ({ actor, params, body }) => service.updateTicket(actor, params.id, body), "client.tickets.write");
  router.post("/clientos/tickets/:id/assign", ({ actor, params, body }) => service.assignTicket(actor, params.id, body), "client.tickets.write");
  router.post("/clientos/tickets/:id/respond", ({ actor, params, body }) => service.respondToTicket(actor, params.id, body), "client.tickets.write");
  router.post("/clientos/tickets/:id/resolve", ({ actor, params, body }) => service.resolveTicket(actor, params.id, body), "client.tickets.write");
  router.post("/clientos/tickets/:id/close", ({ actor, params, body }) => service.closeTicket(actor, params.id, body), "client.tickets.write");

  router.get("/clientos/sla-policies", ({ actor }) => service.listSlaPolicies(actor), "client.sla.read");
  router.post("/clientos/sla-policies", ({ actor, body }) => service.createSlaPolicy(actor, body), "client.sla.write");
  router.patch("/clientos/sla-policies/:id", ({ actor, params, body }) => service.updateSlaPolicy(actor, params.id, body), "client.sla.write");

  router.get("/clientos/notes", ({ actor, query }) => service.listNotes(actor, Object.fromEntries(query.entries())), "client.read");
  router.post("/clientos/notes", ({ actor, body }) => service.createNote(actor, body), "client.notes.write");
  router.get("/clientos/interactions", ({ actor, query }) => service.listInteractions(actor, Object.fromEntries(query.entries())), "client.read");
  router.post("/clientos/interactions", ({ actor, body }) => service.createInteraction(actor, body), "client.interactions.write");
  router.get("/clientos/tasks", ({ actor, query }) => service.listTasks(actor, Object.fromEntries(query.entries())), "client.read");
  router.post("/clientos/tasks", ({ actor, body }) => service.createTask(actor, body), "client.tasks.write");
  router.patch("/clientos/tasks/:id", ({ actor, params, body }) => service.updateTask(actor, params.id, body), "client.tasks.write");
  router.post("/clientos/tasks/:id/complete", ({ actor, params }) => service.completeTask(actor, params.id), "client.tasks.write");

  router.get("/clientos/segments", ({ actor }) => service.listSegments(actor), "client.segments.read");
  router.post("/clientos/segments", ({ actor, body }) => service.createSegment(actor, body), "client.segments.write");
  router.post("/clientos/segments/:id/evaluate", ({ actor, params }) => service.evaluateSegment(actor, params.id), "client.segments.write");

  router.get("/clientos/events", ({ actor }) => service.listEvents(actor), "client.read");
  router.get("/clientos/audit-logs", ({ actor }) => service.listAuditLogs(actor), "client.audit.read");
  return router;
}
