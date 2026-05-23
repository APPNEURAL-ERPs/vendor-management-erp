import type { TaxRule } from "../../domain/types";
import { ConflictError } from "../../shared/errors";
import type { EventBus } from "../../shared/events";
import { createId, nowIso } from "../../shared/id";
import { InMemoryRepository } from "../../shared/store";

export interface CreateTaxRuleInput {
  tenantId: string;
  name: string;
  rate: number;
  categoryId?: string;
  active?: boolean;
}

export class TaxService {
  private taxRules = new InMemoryRepository<TaxRule>();

  constructor(private eventBus: EventBus) {}

  createTaxRule(input: CreateTaxRuleInput): TaxRule {
    if (input.rate < 0 || input.rate > 100) {
      throw new ConflictError("Tax rate must be between 0 and 100");
    }

    const now = nowIso();
    const rule: TaxRule = {
      id: createId("TAX"),
      tenantId: input.tenantId,
      name: input.name,
      rate: input.rate,
      categoryId: input.categoryId,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now
    };

    const created = this.taxRules.create(rule);
    this.eventBus.publish("tax.rule.created", "CommerceOS", input.tenantId, created);
    return created;
  }

  listTaxRules(tenantId: string): TaxRule[] {
    return this.taxRules.listByTenant(tenantId);
  }
}
