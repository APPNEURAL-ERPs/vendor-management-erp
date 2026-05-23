import { SlaPolicy, Ticket } from "../core/domain";
import { addMinutes } from "../core/utils";

export interface SlaDeadlines { firstResponseDueAt?: string; resolutionDueAt?: string; }
export interface TicketSlaStatus { firstResponseBreached: boolean; resolutionBreached: boolean; minutesUntilResolutionDue?: number; status: "within_sla" | "first_response_breached" | "resolution_breached" | "completed"; }

export class TicketSlaEngine {
  calculateDeadlines(createdAt: string, policy?: SlaPolicy): SlaDeadlines {
    if (!policy || policy.status !== "active") return {};
    return {
      firstResponseDueAt: addMinutes(createdAt, policy.firstResponseMinutes),
      resolutionDueAt: addMinutes(createdAt, policy.resolutionMinutes)
    };
  }

  evaluate(ticket: Ticket, nowIso = new Date().toISOString()): TicketSlaStatus {
    if (["resolved", "closed", "cancelled"].includes(ticket.status)) return { firstResponseBreached: false, resolutionBreached: false, status: "completed" };
    const now = new Date(nowIso).getTime();
    const firstResponseBreached = Boolean(ticket.firstResponseDueAt && !ticket.firstResponseAt && now > new Date(ticket.firstResponseDueAt).getTime());
    const resolutionBreached = Boolean(ticket.resolutionDueAt && !ticket.resolvedAt && now > new Date(ticket.resolutionDueAt).getTime());
    const minutesUntilResolutionDue = ticket.resolutionDueAt ? Math.floor((new Date(ticket.resolutionDueAt).getTime() - now) / 60_000) : undefined;
    return { firstResponseBreached, resolutionBreached, minutesUntilResolutionDue, status: resolutionBreached ? "resolution_breached" : firstResponseBreached ? "first_response_breached" : "within_sla" };
  }
}
