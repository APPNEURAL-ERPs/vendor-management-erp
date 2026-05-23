import type { Address, Cart } from "../../domain/types";
import { BadRequestError, ConflictError, NotFoundError } from "../../shared/errors";
import type { EventBus } from "../../shared/events";
import { createId, nowIso } from "../../shared/id";
import { InMemoryRepository } from "../../shared/store";
import type { PricingEngine } from "../pricing/pricing.engine";
import type { ProductService } from "../products/product.service";

export interface CartView {
  cart: Cart;
  pricing: ReturnType<PricingEngine["priceCart"]>;
}

export class CartService {
  private carts = new InMemoryRepository<Cart>();

  constructor(
    private products: ProductService,
    private pricing: PricingEngine,
    private eventBus: EventBus
  ) {}

  createCart(input: { tenantId: string; customerId?: string }): CartView {
    const now = nowIso();
    const cart: Cart = {
      id: createId("CART"),
      tenantId: input.tenantId,
      customerId: input.customerId,
      status: "active",
      items: [],
      createdAt: now,
      updatedAt: now
    };

    const created = this.carts.create(cart);
    this.eventBus.publish("cart.created", "CommerceOS", created.tenantId, created);
    return this.getCart(created.tenantId, created.id);
  }

  getRawCart(tenantId: string, cartId: string): Cart {
    const cart = this.carts.get(cartId);
    if (cart.tenantId !== tenantId) {
      throw new NotFoundError(`Cart not found: ${cartId}`);
    }
    return cart;
  }

  getCart(tenantId: string, cartId: string): CartView {
    const cart = this.getRawCart(tenantId, cartId);
    return {
      cart,
      pricing: this.pricing.priceCart(cart)
    };
  }

  addItem(input: { tenantId: string; cartId: string; productId: string; quantity: number }): CartView {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new BadRequestError("quantity must be a positive integer");
    }

    const cart = this.assertActiveCart(input.tenantId, input.cartId);
    const product = this.products.getProduct(input.tenantId, input.productId);
    if (product.status !== "active") {
      throw new ConflictError("Cannot add inactive product to cart");
    }

    const existing = cart.items.find((item) => item.productId === input.productId);
    const nextQuantity = existing ? existing.quantity + input.quantity : input.quantity;
    if (product.stockTracked && product.stockQuantity < nextQuantity) {
      throw new ConflictError(`Insufficient stock for ${product.name}`, {
        productId: product.id,
        available: product.stockQuantity,
        requested: nextQuantity
      });
    }

    const updatedItems = existing
      ? cart.items.map((item) =>
          item.productId === input.productId ? { ...item, quantity: nextQuantity } : item
        )
      : [
          ...cart.items,
          {
            id: createId("CITEM"),
            productId: input.productId,
            quantity: input.quantity,
            addedAt: nowIso()
          }
        ];

    const updated = this.carts.update(cart.id, (current) => ({
      ...current,
      items: updatedItems,
      updatedAt: nowIso()
    }));

    this.eventBus.publish("cart.item.added", "CommerceOS", input.tenantId, {
      cartId: updated.id,
      productId: input.productId,
      quantity: input.quantity
    });

    return this.getCart(input.tenantId, updated.id);
  }

  updateItem(input: { tenantId: string; cartId: string; itemId: string; quantity: number }): CartView {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new BadRequestError("quantity must be a positive integer");
    }

    const cart = this.assertActiveCart(input.tenantId, input.cartId);
    const currentItem = cart.items.find((item) => item.id === input.itemId);
    if (!currentItem) {
      throw new NotFoundError(`Cart item not found: ${input.itemId}`);
    }

    const product = this.products.getProduct(input.tenantId, currentItem.productId);
    if (product.stockTracked && product.stockQuantity < input.quantity) {
      throw new ConflictError(`Insufficient stock for ${product.name}`, {
        productId: product.id,
        available: product.stockQuantity,
        requested: input.quantity
      });
    }

    const updated = this.carts.update(cart.id, (current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === input.itemId ? { ...item, quantity: input.quantity } : item
      ),
      updatedAt: nowIso()
    }));

    this.eventBus.publish("cart.item.updated", "CommerceOS", input.tenantId, {
      cartId: updated.id,
      itemId: input.itemId,
      quantity: input.quantity
    });

    return this.getCart(input.tenantId, updated.id);
  }

  removeItem(input: { tenantId: string; cartId: string; itemId: string }): CartView {
    const cart = this.assertActiveCart(input.tenantId, input.cartId);
    if (!cart.items.some((item) => item.id === input.itemId)) {
      throw new NotFoundError(`Cart item not found: ${input.itemId}`);
    }

    const updated = this.carts.update(cart.id, (current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== input.itemId),
      updatedAt: nowIso()
    }));

    this.eventBus.publish("cart.item.removed", "CommerceOS", input.tenantId, {
      cartId: updated.id,
      itemId: input.itemId
    });

    return this.getCart(input.tenantId, updated.id);
  }

  applyDiscount(input: { tenantId: string; cartId: string; code: string }): CartView {
    const cart = this.assertActiveCart(input.tenantId, input.cartId);
    const code = input.code.trim().toUpperCase();

    // Validate the discount before writing it to the cart.
    const pricing = this.pricing.priceCart({ ...cart, discountCode: code });

    const updated = this.carts.update(cart.id, (current) => ({
      ...current,
      discountCode: code,
      updatedAt: nowIso()
    }));

    this.eventBus.publish("discount.applied", "CommerceOS", input.tenantId, {
      cartId: updated.id,
      code: updated.discountCode,
      amountMinor: pricing.discount.amountMinor
    });

    return {
      cart: updated,
      pricing
    };
  }

  setDeliveryAddress(input: { tenantId: string; cartId: string; deliveryAddress: Address }): CartView {
    const cart = this.assertActiveCart(input.tenantId, input.cartId);
    const updated = this.carts.update(cart.id, (current) => ({
      ...current,
      deliveryAddress: input.deliveryAddress,
      updatedAt: nowIso()
    }));
    return this.getCart(input.tenantId, updated.id);
  }

  markConverted(tenantId: string, cartId: string): Cart {
    const cart = this.assertActiveCart(tenantId, cartId);
    return this.carts.update(cart.id, (current) => ({
      ...current,
      status: "converted",
      updatedAt: nowIso()
    }));
  }

  private assertActiveCart(tenantId: string, cartId: string): Cart {
    const cart = this.getRawCart(tenantId, cartId);
    if (cart.status !== "active") {
      throw new ConflictError(`Cart is not active: ${cartId}`);
    }
    return cart;
  }
}
