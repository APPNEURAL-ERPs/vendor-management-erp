import type { InventoryAdjustment, Product } from "../../domain/types";
import { BadRequestError, ConflictError } from "../../shared/errors";
import type { EventBus } from "../../shared/events";
import { createId, nowIso } from "../../shared/id";
import { InMemoryRepository } from "../../shared/store";
import type { ProductService } from "../products/product.service";

export class InventoryService {
  private adjustments = new InMemoryRepository<InventoryAdjustment>();

  constructor(private products: ProductService, private eventBus: EventBus) {}

  ensureAvailable(tenantId: string, productId: string, quantity: number): Product {
    if (quantity <= 0) {
      throw new BadRequestError("Quantity must be greater than zero");
    }

    const product = this.products.getProduct(tenantId, productId);
    if (product.status !== "active") {
      throw new ConflictError(`Product is not active: ${productId}`);
    }

    if (product.stockTracked && product.stockQuantity < quantity) {
      throw new ConflictError(`Insufficient stock for ${product.name}`, {
        productId,
        available: product.stockQuantity,
        requested: quantity
      });
    }

    return product;
  }

  decreaseStock(input: {
    tenantId: string;
    productId: string;
    quantity: number;
    reason: string;
    referenceId?: string;
  }): Product {
    const product = this.ensureAvailable(input.tenantId, input.productId, input.quantity);
    if (!product.stockTracked) {
      return product;
    }

    const updated = this.products.updateProduct(input.tenantId, input.productId, {
      stockQuantity: product.stockQuantity - input.quantity
    });

    this.recordAdjustment({
      tenantId: input.tenantId,
      productId: input.productId,
      delta: -input.quantity,
      reason: input.reason,
      referenceId: input.referenceId
    });

    return updated;
  }

  increaseStock(input: {
    tenantId: string;
    productId: string;
    quantity: number;
    reason: string;
    referenceId?: string;
  }): Product {
    if (input.quantity <= 0) {
      throw new BadRequestError("Quantity must be greater than zero");
    }

    const product = this.products.getProductForInternalUse(input.tenantId, input.productId);
    if (!product.stockTracked) {
      return product;
    }

    const updated = this.products.updateProduct(input.tenantId, input.productId, {
      stockQuantity: product.stockQuantity + input.quantity
    });

    this.recordAdjustment({
      tenantId: input.tenantId,
      productId: input.productId,
      delta: input.quantity,
      reason: input.reason,
      referenceId: input.referenceId
    });

    return updated;
  }

  adjustInventory(input: {
    tenantId: string;
    productId: string;
    delta: number;
    reason: string;
    referenceId?: string;
  }): Product {
    if (input.delta === 0) {
      throw new BadRequestError("delta cannot be zero");
    }

    const product = this.products.getProductForInternalUse(input.tenantId, input.productId);
    const nextQuantity = product.stockQuantity + input.delta;
    if (product.stockTracked && nextQuantity < 0) {
      throw new ConflictError("Inventory adjustment would make stock negative", {
        productId: input.productId,
        current: product.stockQuantity,
        delta: input.delta
      });
    }

    const updated = this.products.updateProduct(input.tenantId, input.productId, {
      stockQuantity: nextQuantity
    });

    this.recordAdjustment(input);
    return updated;
  }

  listAdjustments(tenantId: string): InventoryAdjustment[] {
    return this.adjustments.listByTenant(tenantId);
  }

  private recordAdjustment(input: {
    tenantId: string;
    productId: string;
    delta: number;
    reason: string;
    referenceId?: string;
  }): InventoryAdjustment {
    const adjustment: InventoryAdjustment = {
      id: createId("INVADJ"),
      tenantId: input.tenantId,
      productId: input.productId,
      delta: input.delta,
      reason: input.reason,
      referenceId: input.referenceId,
      createdAt: nowIso()
    };

    const created = this.adjustments.create(adjustment);
    this.eventBus.publish("inventory.updated", "CommerceOS", input.tenantId, created);
    return created;
  }
}
