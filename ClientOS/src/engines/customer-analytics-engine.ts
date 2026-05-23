import { ClientState, Ticket } from "../core/domain";
import { TicketSlaEngine } from "./ticket-sla-engine";

export interface ClientAnalyticsSummary {
  totalAccounts: number;
  activeAccounts: number;
  atRiskAccounts: number;
  totalContacts: number;
  openTickets: number;
  overdueTickets: number;
  resolvedTickets: number;
  averageHealthScore: number;
  opportunityPipelineValue: number;
  wonRevenue: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  accountsByLifecycleStage: Record<string, number>;
  topAtRiskAccounts: Array<{ id: string; name: string; healthScore: number; openTickets: number }>;
}

export class CustomerAnalyticsEngine {
  constructor(private readonly sla = new TicketSlaEngine()) {}

  summarize(state: ClientState, tenantId: string): ClientAnalyticsSummary {
    const accounts = state.accounts.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const contacts = state.contacts.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const tickets = state.tickets.filter((item) => item.tenantId === tenantId);
    const opportunities = state.opportunities.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const openTickets = tickets.filter((ticket) => !["resolved", "closed", "cancelled"].includes(ticket.status));
    const overdueTickets = openTickets.filter((ticket) => this.sla.evaluate(ticket).resolutionBreached).length;
    const ticketsByStatus = countBy(tickets, (ticket) => ticket.status);
    const ticketsByPriority = countBy(tickets, (ticket) => ticket.priority);
    const accountsByLifecycleStage = countBy(accounts, (account) => account.lifecycleStage);
    const averageHealthScore = accounts.length ? Math.round(accounts.reduce((sum, item) => sum + item.healthScore, 0) / accounts.length) : 0;
    const opportunityPipelineValue = opportunities.filter((opportunity) => opportunity.status === "open").reduce((sum, item) => sum + item.value, 0);
    const wonRevenue = opportunities.filter((opportunity) => opportunity.status === "won").reduce((sum, item) => sum + item.value, 0);
    const topAtRiskAccounts = accounts
      .map((account) => ({ id: account.id, name: account.name, healthScore: account.healthScore, openTickets: openTickets.filter((ticket) => ticket.accountId === account.id).length }))
      .filter((account) => account.healthScore < 60 || account.openTickets > 0)
      .sort((a, b) => a.healthScore - b.healthScore || b.openTickets - a.openTickets)
      .slice(0, 5);
    return {
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter((account) => account.status === "active").length,
      atRiskAccounts: accounts.filter((account) => account.status === "at_risk" || account.healthScore < 60).length,
      totalContacts: contacts.length,
      openTickets: openTickets.length,
      overdueTickets,
      resolvedTickets: tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length,
      averageHealthScore,
      opportunityPipelineValue,
      wonRevenue,
      ticketsByStatus,
      ticketsByPriority,
      accountsByLifecycleStage,
      topAtRiskAccounts
    };
  }
}

function countBy<T>(items: T[], selector: (item: T) => string | undefined): Record<string, number> {
  const output: Record<string, number> = {};
  for (const item of items) {
    const key = selector(item) ?? "unknown";
    output[key] = (output[key] ?? 0) + 1;
  }
  return output;
}
