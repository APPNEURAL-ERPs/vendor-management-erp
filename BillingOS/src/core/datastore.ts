import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { BillingState, AuditLog, RequestActor } from "../domain";
import { newId, nowIso, clone, redact } from "./utils";

export class DataStore {
  private state: BillingState;
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = resolve(filePath);
    this.load();
  }

  load(): void {
    if (!existsSync(this.filePath)) {
      mkdirSync(dirname(this.filePath), { recursive: true });
      this.save();
      return;
    }
    const raw = readFileSync(this.filePath, "utf-8");
    this.state = raw.trim() ? { ...this.emptyState(), ...JSON.parse(raw) } : this.emptyState();
  }

  save(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  getState(): BillingState {
    return this.state;
  }

  snapshot(): BillingState {
    return clone(this.state);
  }

  reset(nextState: BillingState = this.emptyState()): void {
    this.state = nextState;
    this.save();
  }

  audit(
    actor: RequestActor,
    action: string,
    entityType: string,
    entityId?: string,
    before?: unknown,
    after?: unknown
  ): AuditLog {
    const now = nowIso();
    const audit: AuditLog = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      actorId: actor.userId,
      role: actor.role,
      action,
      entityType,
      entityId,
      before: redact(before),
      after: redact(after),
    };
    this.state.auditLogs.unshift(audit);
    this.save();
    return audit;
  }

  private emptyState(): BillingState {
    return {
      billingAccounts: [],
      pricingPlans: [],
      subscriptions: [],
      trials: [],
      usageRecords: [],
      creditWallets: [],
      creditTransactions: [],
      invoices: [],
      invoiceItems: [],
      payments: [],
      paymentMethods: [],
      refunds: [],
      coupons: [],
      taxRules: [],
      dunningAttempts: [],
      revenueRecords: [],
      reconciliationRecords: [],
      auditLogs: [],
      events: [],
    };
  }
}
