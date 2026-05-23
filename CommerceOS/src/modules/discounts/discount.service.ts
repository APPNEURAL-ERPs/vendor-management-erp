import type { Discount, DiscountCalculation, DiscountType } from "../../domain/types";
import { BadRequestError, ConflictError, NotFoundError } from "../../shared/errors";
import type { EventBus } from "../../shared/events";
import { createId, nowIso, roundMinor } from "../../shared/id";
import { InMemoryRepository } from "../../shared/store";

export interface CreateDiscountInput {
  tenantId: string;
  code: string;
  type: DiscountType;
  value: number;
  minSubtotalMinor?: number;
  maxDiscountMinor?: number;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  active?: boolean;
}

export class DiscountService {
  private discounts = new InMemoryRepository<Discount>();

  constructor(private eventBus: EventBus) {}

  createDiscount(input: CreateDiscountInput): Discount {
    const code = input.code.trim().toUpperCase();
    const duplicate = this.discounts
      .listByTenant(input.tenantId)
      .find((discount) => discount.code === code);

    if (duplicate) {
      throw new ConflictError(`Discount code already exists: ${code}`);
    }

    if (input.type === "percentage" && (input.value <= 0 || input.value > 100)) {
      throw new BadRequestError("Percentage discount value must be between 1 and 100");
    }

    if (input.type === "fixed" && input.value <= 0) {
      throw new BadRequestError("Fixed discount value must be greater than zero");
    }

    const now = nowIso();
    const discount: Discount = {
      id: createId("DISC"),
      tenantId: input.tenantId,
      code,
      type: input.type,
      value: input.value,
      minSubtotalMinor: input.minSubtotalMinor,
      maxDiscountMinor: input.maxDiscountMinor,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      usageLimit: input.usageLimit,
      usedCount: 0,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now
    };

    const created = this.discounts.create(discount);
    this.eventBus.publish("discount.created", "CommerceOS", input.tenantId, created);
    return created;
  }

  listDiscounts(tenantId: string): Discount[] {
    return this.discounts.listByTenant(tenantId);
  }

  getByCode(tenantId: string, code: string): Discount {
    const discount = this.discounts
      .listByTenant(tenantId)
      .find((item) => item.code === code.trim().toUpperCase());

    if (!discount) {
      throw new NotFoundError(`Discount code not found: ${code}`);
    }

    return discount;
  }

  calculate(tenantId: string, code: string | undefined, subtotalMinor: number): DiscountCalculation {
    if (!code) {
      return { amountMinor: 0 };
    }

    const discount = this.getByCode(tenantId, code);
    this.assertDiscountCanApply(discount, subtotalMinor);

    let amountMinor = 0;
    if (discount.type === "percentage") {
      amountMinor = roundMinor((subtotalMinor * discount.value) / 100);
    } else {
      amountMinor = roundMinor(discount.value);
    }

    if (discount.maxDiscountMinor !== undefined) {
      amountMinor = Math.min(amountMinor, discount.maxDiscountMinor);
    }

    amountMinor = Math.min(amountMinor, subtotalMinor);

    return {
      code: discount.code,
      amountMinor
    };
  }

  markUsed(tenantId: string, code: string | undefined): void {
    if (!code) return;
    const discount = this.getByCode(tenantId, code);
    this.discounts.update(discount.id, (current) => ({
      ...current,
      usedCount: current.usedCount + 1,
      updatedAt: nowIso()
    }));
  }

  private assertDiscountCanApply(discount: Discount, subtotalMinor: number): void {
    const now = Date.now();

    if (!discount.active) {
      throw new ConflictError(`Discount code is inactive: ${discount.code}`);
    }

    if (discount.startsAt && Date.parse(discount.startsAt) > now) {
      throw new ConflictError(`Discount code is not active yet: ${discount.code}`);
    }

    if (discount.endsAt && Date.parse(discount.endsAt) < now) {
      throw new ConflictError(`Discount code has expired: ${discount.code}`);
    }

    if (discount.usageLimit !== undefined && discount.usedCount >= discount.usageLimit) {
      throw new ConflictError(`Discount usage limit reached: ${discount.code}`);
    }

    if (discount.minSubtotalMinor !== undefined && subtotalMinor < discount.minSubtotalMinor) {
      throw new ConflictError(`Cart subtotal is below minimum for discount: ${discount.code}`, {
        minSubtotalMinor: discount.minSubtotalMinor,
        subtotalMinor
      });
    }
  }
}
