import { DataStore, EventBus } from "./core";
import {
  CommerceOverview,
  CommerceState,
  Product,
  ProductCategory,
  ProductVariant,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Refund,
  Subscription,
  Customer,
  Invoice,
  CheckoutSession,
  Review,
  Coupon,
  RequestActor,
  CommerceEvent
} from "./domain";
import {
  asNumber,
  asBoolean,
  badRequest,
  conflict,
  ensureArray,
  ensureObject,
  ensureString,
  newId,
  notFound,
  nowIso,
  optionalObject,
  pickQuery,
  clone
} from "./core";

export class CommerceService {
  readonly eventBus: EventBus;

  constructor(private readonly store: DataStore) {
    this.eventBus = new EventBus(store);
  }

  getRoutesSummary(): string {
    return "CommerceOS service is ready";
  }

  overview(actor: RequestActor): CommerceOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const products = state.products.filter((item) => item.tenantId === tenant);
    const orders = state.orders.filter((item) => item.tenantId === tenant);
    const customers = state.customers.filter((item) => item.tenantId === tenant);
    const payments = state.payments.filter((item) => item.tenantId === tenant);
    const subscriptions = state.subscriptions.filter((item) => item.tenantId === tenant);
    const inventory = state.inventory.filter((item) => item.tenantId === tenant);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const revenueTotal = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const revenueThisMonth = payments
      .filter((p) => p.status === "paid" && new Date(p.paidAt!) >= thisMonth)
      .reduce((sum, p) => sum + p.amount, 0);

    const revenueThisWeek = payments
      .filter((p) => p.status === "paid" && new Date(p.paidAt!) >= thisWeek)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      products: {
        total: products.length,
        active: products.filter((p) => p.status === "active").length
      },
      orders: {
        total: orders.length,
        pending: orders.filter((o) => o.status === "pending").length,
        completed: orders.filter((o) => ["delivered", "completed"].includes(o.status)).length,
        cancelled: orders.filter((o) => ["cancelled", "refunded"].includes(o.status)).length
      },
      customers: {
        total: customers.length,
        active: customers.filter((c) => c.status === "active").length
      },
      revenue: {
        total: revenueTotal,
        thisMonth: revenueThisMonth,
        thisWeek: revenueThisWeek
      },
      payments: {
        total: payments.length,
        successful: payments.filter((p) => p.status === "paid").length,
        failed: payments.filter((p) => p.status === "failed").length,
        pending: payments.filter((p) => p.status === "pending" || p.status === "authorized").length
      },
      subscriptions: {
        total: subscriptions.length,
        active: subscriptions.filter((s) => s.status === "active").length,
        trial: subscriptions.filter((s) => s.status === "trial").length
      },
      inventory: {
        totalItems: inventory.reduce((sum, i) => sum + i.quantity, 0),
        lowStock: inventory.filter((i) => i.status === "low_stock").length,
        outOfStock: inventory.filter((i) => i.status === "out_of_stock").length
      }
    };
  }

  listProducts(actor: RequestActor, query?: URLSearchParams): Product[] {
    const state = this.store.getState();
    const search = pickQuery(query, "search")?.toLowerCase();
    const categoryId = pickQuery(query, "categoryId");
    const status = pickQuery(query, "status");

    return clone(
      state.products.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
        if (categoryId && item.categoryId !== categoryId) return false;
        if (status && item.status !== status) return false;
        return true;
      })
    );
  }

  getProduct(id: string, actor: RequestActor): Product {
    const product = this.store.getState().products.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!product) notFound("Product not found");
    return clone(product);
  }

  createProduct(input: unknown, actor: RequestActor): Product {
    const body = ensureObject(input, "product");
    const state = this.store.getState();
    const key = ensureString(body.key, "product.key");
    if (state.products.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Product key '${key}' already exists`);
    }

    const product: Product = {
      id: newId("prod"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "product.name"),
      description: optionalString(body.description),
      shortDescription: optionalString(body.shortDescription),
      type: String(body.type ?? "service") as any,
      status: String(body.status ?? "active") as any,
      categoryId: optionalString(body.categoryId),
      variants: [],
      basePrice: ensureNumber(body.basePrice, "product.basePrice", 0),
      costPrice: asNumber(body.costPrice),
      sku: optionalString(body.sku),
      barcode: optionalString(body.barcode),
      weight: asNumber(body.weight),
      dimensions: optionalObject(body.dimensions) as any,
      images: ensureArray(body.images, "product.images", []),
      tags: ensureArray(body.tags, "product.tags", []),
      metadata: optionalObject(body.metadata)
    };

    state.products.push(product);
    this.store.save();
    this.store.audit(actor, "product.create", "product", product.id, undefined, product);
    this.eventBus.emit(actor, "commerce.product.created", { productId: product.id, productKey: product.key });

    return clone(product);
  }

  updateProduct(id: string, input: unknown, actor: RequestActor): Product {
    const body = ensureObject(input, "product");
    const state = this.store.getState();
    const product = state.products.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!product) notFound("Product not found");

    const before = clone(product);

    if (body.name !== undefined) product.name = ensureString(body.name, "product.name");
    if (body.description !== undefined) product.description = optionalString(body.description);
    if (body.shortDescription !== undefined) product.shortDescription = optionalString(body.shortDescription);
    if (body.type !== undefined) product.type = String(body.type) as any;
    if (body.status !== undefined) product.status = String(body.status) as any;
    if (body.categoryId !== undefined) product.categoryId = optionalString(body.categoryId);
    if (body.basePrice !== undefined) product.basePrice = ensureNumber(body.basePrice, "product.basePrice");
    if (body.costPrice !== undefined) product.costPrice = asNumber(body.costPrice);
    if (body.sku !== undefined) product.sku = optionalString(body.sku);
    if (body.barcode !== undefined) product.barcode = optionalString(body.barcode);
    if (body.images !== undefined) product.images = ensureArray(body.images, "product.images");
    if (body.tags !== undefined) product.tags = ensureArray(body.tags, "product.tags");
    if (body.metadata !== undefined) product.metadata = optionalObject(body.metadata);

    product.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "product.update", "product", product.id, before, product);
    this.eventBus.emit(actor, "commerce.product.updated", { productId: product.id, productKey: product.key });

    return clone(product);
  }

  listCategories(actor: RequestActor): ProductCategory[] {
    return clone(this.store.getState().categories.filter((item) => item.tenantId === actor.tenantId));
  }

  createCategory(input: unknown, actor: RequestActor): ProductCategory {
    const body = ensureObject(input, "category");
    const state = this.store.getState();

    const category: ProductCategory = {
      id: newId("cat"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "category.key"),
      name: ensureString(body.name, "category.name"),
      description: optionalString(body.description),
      parentId: optionalString(body.parentId),
      status: String(body.status ?? "active") as any,
      tags: ensureArray(body.tags, "category.tags", [])
    };

    state.categories.push(category);
    this.store.save();
    this.store.audit(actor, "category.create", "category", category.id, undefined, category);

    return clone(category);
  }

  listCarts(actor: RequestActor, query?: URLSearchParams): Cart[] {
    const customerId = pickQuery(query, "customerId");
    const status = pickQuery(query, "status");

    return clone(
      this.store.getState().carts.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (customerId && item.customerId !== customerId) return false;
        if (status && item.status !== status) return false;
        return true;
      })
    );
  }

  getCart(id: string, actor: RequestActor): Cart {
    const cart = this.store.getState().carts.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!cart) notFound("Cart not found");
    return clone(cart);
  }

  createCart(input: unknown, actor: RequestActor): Cart {
    const body = ensureObject(input, "cart");

    const cart: Cart = {
      id: newId("cart"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      customerId: optionalString(body.customerId),
      sessionId: optionalString(body.sessionId),
      items: [],
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: 0,
      total: 0,
      status: "active"
    };

    this.store.getState().carts.unshift(cart);
    this.store.save();
    this.store.audit(actor, "cart.create", "cart", cart.id, undefined, cart);

    return clone(cart);
  }

  addToCart(cartId: string, input: unknown, actor: RequestActor): Cart {
    const body = ensureObject(input, "cartItem");
    const state = this.store.getState();
    const cart = state.carts.find((item) => item.id === cartId && item.tenantId === actor.tenantId);
    if (!cart) notFound("Cart not found");

    const product = this.requireProduct(String(body.productId), actor.tenantId);
    const variantId = optionalString(body.variantId);
    const quantity = ensureNumber(body.quantity, "cartItem.quantity", 1);

    let variant: ProductVariant | undefined;
    if (variantId) {
      variant = product.variants.find((v) => v.id === variantId);
      if (!variant) notFound("Product variant not found");
    } else if (product.variants.length === 1) {
      variant = product.variants[0];
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === product.id && item.variantId === variantId
    );

    if (existingItemIndex >= 0) {
      const existingItem = cart.items[existingItemIndex];
      existingItem.quantity += quantity;
      existingItem.totalPrice = existingItem.unitPrice * existingItem.quantity;
    } else {
      const unitPrice = variant?.price ?? product.basePrice;
      const cartItem: CartItem = {
        productId: product.id,
        variantId: variant?.id,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        metadata: optionalObject(body.metadata)
      };
      cart.items.push(cartItem);
    }

    this.recalculateCartTotals(cart, state);
    cart.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "cart.add_item", "cart", cart.id, undefined, { productId: product.id, quantity });

    return clone(cart);
  }

  private recalculateCartTotals(cart: Cart, state: CommerceState): void {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.discountAmount = 0;
    cart.taxAmount = Math.round(cart.subtotal * 0.18);
    cart.shippingAmount = cart.subtotal >= 999 ? 0 : 99;
    cart.total = cart.subtotal + cart.taxAmount + cart.shippingAmount - cart.discountAmount;
  }

  removeFromCart(cartId: string, productId: string, actor: RequestActor): Cart {
    const state = this.store.getState();
    const cart = state.carts.find((item) => item.id === cartId && item.tenantId === actor.tenantId);
    if (!cart) notFound("Cart not found");

    cart.items = cart.items.filter((item) => item.productId !== productId);
    this.recalculateCartTotals(cart, state);
    cart.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "cart.remove_item", "cart", cart.id, undefined, { productId });

    return clone(cart);
  }

  applyCoupon(cartId: string, input: unknown, actor: RequestActor): Cart {
    const body = ensureObject(input, "coupon");
    const code = ensureString(body.code, "coupon.code");
    const state = this.store.getState();
    const cart = state.carts.find((item) => item.id === cartId && item.tenantId === actor.tenantId);
    if (!cart) notFound("Cart not found");

    const coupon = state.coupons.find((c) => c.code === code && c.tenantId === actor.tenantId && c.status === "active");
    if (!coupon) notFound("Coupon not found or inactive");

    if (new Date(coupon.validUntil) < new Date()) notFound("Coupon has expired");
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) badRequest("Coupon usage limit reached");
    if (coupon.minOrderAmount && cart.subtotal < coupon.minOrderAmount) {
      badRequest(`Minimum order amount of ₹${coupon.minOrderAmount} required`);
    }

    cart.couponId = coupon.id;

    if (coupon.type === "percentage") {
      cart.discountAmount = Math.min(
        Math.round((cart.subtotal * coupon.value) / 100),
        coupon.maxDiscountAmount ?? Infinity
      );
    } else if (coupon.type === "fixed_amount") {
      cart.discountAmount = Math.min(coupon.value, cart.subtotal);
    } else if (coupon.type === "free_shipping") {
      cart.shippingAmount = 0;
    }

    this.recalculateCartTotals(cart, state);
    cart.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "cart.apply_coupon", "cart", cart.id, undefined, { couponCode: code });

    return clone(cart);
  }

  initiateCheckout(cartId: string, input: unknown, actor: RequestActor): CheckoutSession {
    const body = ensureObject(input, "checkout");
    const state = this.store.getState();
    const cart = state.carts.find((item) => item.id === cartId && item.tenantId === actor.tenantId);
    if (!cart) notFound("Cart not found");
    if (cart.items.length === 0) badRequest("Cart is empty");

    const session: CheckoutSession = {
      id: newId("checkout"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      cartId: cart.id,
      customerId: optionalString(body.customerId),
      customerEmail: optionalString(body.customerEmail),
      status: "initiated",
      shippingAddress: optionalObject(body.shippingAddress) as any,
      billingAddress: optionalObject(body.billingAddress) as any,
      shippingMethod: optionalString(body.shippingMethod),
      paymentMethod: optionalString(body.paymentMethod),
      couponCode: optionalString(body.couponCode),
      metadata: {}
    };

    state.checkoutSessions.unshift(session);
    cart.status = "active";
    this.store.save();
    this.store.audit(actor, "checkout.initiate", "checkoutSession", session.id, undefined, { cartId });

    return clone(session);
  }

  processCheckout(checkoutId: string, input: unknown, actor: RequestActor): { order: Order; payment: Payment } {
    const body = ensureObject(input, "payment");
    const state = this.store.getState();
    const session = state.checkoutSessions.find((item) => item.id === checkoutId && item.tenantId === actor.tenantId);
    if (!session) notFound("Checkout session not found");
    if (session.status !== "initiated") badRequest("Checkout session is not in initiated status");

    const cart = state.carts.find((item) => item.id === session.cartId);
    if (!cart) notFound("Cart not found");

    const customerEmail = session.customerEmail ?? body.customerEmail as string;
    if (!customerEmail) badRequest("Customer email is required");

    const orderNumber = `ORD-${new Date().getFullYear()}-${String(state.orders.length + 1).padStart(3, "0")}`;

    const orderItems: OrderItem[] = cart.items.map((item) => {
      const product = state.products.find((p) => p.id === item.productId);
      const variant = item.variantId ? product?.variants.find((v) => v.id === item.variantId) : undefined;
      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: product?.name ?? "Unknown Product",
        variantName: variant?.name,
        sku: variant?.sku ?? product?.sku ?? "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: 0,
        taxAmount: Math.round((item.totalPrice * 18) / 118),
        totalPrice: item.unitPrice * item.quantity
      };
    });

    const order: Order = {
      id: newId("ord"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      orderNumber,
      customerId: session.customerId,
      customerEmail,
      items: orderItems,
      subtotal: cart.subtotal,
      discountAmount: cart.discountAmount,
      taxAmount: cart.taxAmount,
      shippingAmount: cart.shippingAmount,
      total: cart.total,
      status: "pending",
      shippingAddress: session.shippingAddress,
      billingAddress: session.billingAddress,
      couponId: cart.couponId,
      metadata: {}
    };

    const paymentMethod = String(body.method ?? "card");
    const payment: Payment = {
      id: newId("pay"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      orderId: order.id,
      amount: order.total,
      currency: "INR",
      method: paymentMethod as any,
      status: "pending",
      gateway: optionalString(body.gateway),
      metadata: optionalObject(body.metadata)
    };

    session.status = "processing";
    session.orderId = order.id;
    cart.status = "converted";

    state.orders.unshift(order);
    state.payments.unshift(payment);

    this.store.save();
    this.store.audit(actor, "checkout.process", "order", order.id, undefined, { orderNumber, paymentId: payment.id });
    this.eventBus.emit(actor, "commerce.order.created", { orderId: order.id, orderNumber });

    return { order: clone(order), payment: clone(payment) };
  }

  processPayment(paymentId: string, input: unknown, actor: RequestActor): Payment {
    const body = ensureObject(input, "payment");
    const state = this.store.getState();
    const payment = state.payments.find((item) => item.id === paymentId && item.tenantId === actor.tenantId);
    if (!payment) notFound("Payment not found");

    const order = state.orders.find((o) => o.id === payment.orderId);
    if (!order) notFound("Order not found");

    payment.status = String(body.status ?? "paid") as any;
    payment.gatewayTransactionId = optionalString(body.transactionId) ?? payment.gatewayTransactionId;
    if (payment.status === "paid") {
      payment.paidAt = nowIso();
      order.status = "confirmed";
    } else if (payment.status === "failed") {
      order.status = "failed";
    }

    payment.updatedAt = nowIso();
    order.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "payment.process", "payment", payment.id, undefined, {
      status: payment.status,
      gatewayTransactionId: payment.gatewayTransactionId
    });

    if (payment.status === "paid") {
      this.eventBus.emit(actor, "commerce.payment.completed", { paymentId: payment.id, orderId: order.id });
    } else if (payment.status === "failed") {
      this.eventBus.emit(actor, "commerce.payment.failed", { paymentId: payment.id, orderId: order.id });
    }

    return clone(payment);
  }

  listOrders(actor: RequestActor, query?: URLSearchParams): Order[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const customerId = pickQuery(query, "customerId");

    return clone(
      this.store.getState().orders.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (search && !`${item.orderNumber} ${item.customerEmail ?? ""}`.toLowerCase().includes(search)) return false;
        if (status && item.status !== status) return false;
        if (customerId && item.customerId !== customerId) return false;
        return true;
      })
    );
  }

  getOrder(id: string, actor: RequestActor): Order {
    const order = this.store.getState().orders.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!order) notFound("Order not found");
    return clone(order);
  }

  updateOrderStatus(orderId: string, input: unknown, actor: RequestActor): Order {
    const body = ensureObject(input, "status");
    const state = this.store.getState();
    const order = state.orders.find((item) => item.id === orderId && item.tenantId === actor.tenantId);
    if (!order) notFound("Order not found");

    const newStatus = ensureString(body.status, "status.status");
    const beforeStatus = order.status;
    order.status = newStatus as any;
    order.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "order.status_update", "order", order.id, { status: beforeStatus }, { status: newStatus });
    this.eventBus.emit(actor, "commerce.order.status_changed", { orderId: order.id, oldStatus: beforeStatus, newStatus });

    return clone(order);
  }

  listPayments(actor: RequestActor, query?: URLSearchParams): Payment[] {
    const status = pickQuery(query, "status");
    const orderId = pickQuery(query, "orderId");

    return clone(
      this.store.getState().payments.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (status && item.status !== status) return false;
        if (orderId && item.orderId !== orderId) return false;
        return true;
      })
    );
  }

  createRefund(input: unknown, actor: RequestActor): Refund {
    const body = ensureObject(input, "refund");
    const state = this.store.getState();

    const order = this.requireOrder(String(body.orderId), actor.tenantId);
    const payment = state.payments.find((p) => p.orderId === order.id && p.status === "paid");
    if (!payment) notFound("No paid payment found for this order");

    const refund: Refund = {
      id: newId("refund"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      orderId: order.id,
      paymentId: payment.id,
      amount: asNumber(body.amount, payment.amount),
      reason: ensureString(body.reason, "refund.reason"),
      status: "requested",
      metadata: {}
    };

    state.refunds.unshift(refund);
    this.store.save();
    this.store.audit(actor, "refund.create", "refund", refund.id, undefined, { orderId: order.id, amount: refund.amount });

    return clone(refund);
  }

  processRefund(refundId: string, input: unknown, actor: RequestActor): Refund {
    const body = ensureObject(input, "refund");
    const state = this.store.getState();
    const refund = state.refunds.find((item) => item.id === refundId && item.tenantId === actor.tenantId);
    if (!refund) notFound("Refund not found");

    const status = ensureString(body.status, "refund.status");
    refund.status = status as any;
    refund.processedAt = nowIso();
    refund.updatedAt = nowIso();

    if (status === "refunded") {
      const payment = state.payments.find((p) => p.id === refund.paymentId);
      if (payment) {
        payment.status = refund.amount >= payment.amount ? "refunded" : "partially_refunded";
      }
      const order = state.orders.find((o) => o.id === refund.orderId);
      if (order) {
        order.status = "refunded";
      }
    }

    this.store.save();
    this.store.audit(actor, "refund.process", "refund", refund.id, undefined, { status: refund.status });

    return clone(refund);
  }

  listCustomers(actor: RequestActor, query?: URLSearchParams): Customer[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");

    return clone(
      this.store.getState().customers.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (search && !`${item.email} ${item.displayName}`.toLowerCase().includes(search)) return false;
        if (status && item.status !== status) return false;
        return true;
      })
    );
  }

  getCustomer(id: string, actor: RequestActor): Customer {
    const customer = this.store.getState().customers.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!customer) notFound("Customer not found");
    return clone(customer);
  }

  createCustomer(input: unknown, actor: RequestActor): Customer {
    const body = ensureObject(input, "customer");
    const state = this.store.getState();

    const customer: Customer = {
      id: newId("cust"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      email: ensureString(body.email, "customer.email").toLowerCase(),
      displayName: ensureString(body.displayName, "customer.displayName"),
      phone: optionalString(body.phone),
      addresses: [],
      status: String(body.status ?? "active") as any,
      tags: ensureArray(body.tags, "customer.tags", []),
      totalOrders: 0,
      totalSpent: 0,
      metadata: optionalObject(body.metadata)
    };

    state.customers.unshift(customer);
    this.store.save();
    this.store.audit(actor, "customer.create", "customer", customer.id, undefined, customer);

    return clone(customer);
  }

  listCoupons(actor: RequestActor, query?: URLSearchParams): Coupon[] {
    const status = pickQuery(query, "status");

    return clone(
      this.store.getState().coupons.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (status && item.status !== status) return false;
        return true;
      })
    );
  }

  createCoupon(input: unknown, actor: RequestActor): Coupon {
    const body = ensureObject(input, "coupon");
    const state = this.store.getState();

    const coupon: Coupon = {
      id: newId("coup"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: createdAt,
      code: ensureString(body.code, "coupon.code").toUpperCase(),
      name: ensureString(body.name, "coupon.name"),
      description: optionalString(body.description),
      type: String(body.type ?? "percentage") as any,
      value: ensureNumber(body.value, "coupon.value"),
      minOrderAmount: asNumber(body.minOrderAmount),
      maxDiscountAmount: asNumber(body.maxDiscountAmount),
      usageLimit: asNumber(body.usageLimit),
      usedCount: 0,
      validFrom: String(body.validFrom ?? nowIso()),
      validUntil: String(body.validUntil ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
      status: String(body.status ?? "active") as any,
      applicableProductIds: ensureArray(body.applicableProductIds, "coupon.applicableProductIds"),
      applicableCategoryIds: ensureArray(body.applicableCategoryIds, "coupon.applicableCategoryIds")
    };

    state.coupons.push(coupon);
    this.store.save();
    this.store.audit(actor, "coupon.create", "coupon", coupon.id, undefined, coupon);

    return clone(coupon);
  }

  listSubscriptions(actor: RequestActor, query?: URLSearchParams): Subscription[] {
    const status = pickQuery(query, "status");
    const customerId = pickQuery(query, "customerId");

    return clone(
      this.store.getState().subscriptions.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (status && item.status !== status) return false;
        if (customerId && item.customerId !== customerId) return false;
        return true;
      })
    );
  }

  createSubscription(input: unknown, actor: RequestActor): Subscription {
    const body = ensureObject(input, "subscription");
    const state = this.store.getState();

    const subscription: Subscription = {
      id: newId("sub"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      customerId: ensureString(body.customerId, "subscription.customerId"),
      productId: ensureString(body.productId, "subscription.productId"),
      planId: optionalString(body.planId),
      status: String(body.status ?? "trial") as any,
      billingCycle: String(body.billingCycle ?? "monthly") as any,
      amount: ensureNumber(body.amount, "subscription.amount"),
      startDate: nowIso(),
      endDate: optionalString(body.endDate),
      nextBillingDate: optionalString(body.nextBillingDate),
      trialEndDate: optionalString(body.trialEndDate),
      metadata: optionalObject(body.metadata)
    };

    state.subscriptions.unshift(subscription);
    this.store.save();
    this.store.audit(actor, "subscription.create", "subscription", subscription.id, undefined, subscription);

    return clone(subscription);
  }

  listReviews(actor: RequestActor, query?: URLSearchParams): Review[] {
    const productId = pickQuery(query, "productId");
    const status = pickQuery(query, "status");

    return clone(
      this.store.getState().reviews.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (productId && item.productId !== productId) return false;
        if (status && item.status !== status) return false;
        return true;
      })
    );
  }

  createReview(input: unknown, actor: RequestActor): Review {
    const body = ensureObject(input, "review");

    const review: Review = {
      id: newId("review"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      productId: ensureString(body.productId, "review.productId"),
      orderId: optionalString(body.orderId),
      customerId: optionalString(body.customerId),
      rating: ensureNumber(body.rating, "review.rating"),
      title: optionalString(body.title),
      content: optionalString(body.content),
      status: "pending",
      verified: asBoolean(body.verified, false),
      helpful: 0,
      metadata: {}
    };

    this.store.getState().reviews.unshift(review);
    this.store.save();
    this.store.audit(actor, "review.create", "review", review.id, undefined, { productId: review.productId, rating: review.rating });

    return clone(review);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  listEvents(actor: RequestActor): CommerceEvent[] {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  private requireProduct(idOrKey: string, tenantId: string): Product {
    const item = this.store.getState().products.find(
      (product) => product.tenantId === tenantId && (product.id === idOrKey || product.key === idOrKey)
    );
    if (!item) notFound("Product not found");
    return item;
  }

  private requireOrder(id: string, tenantId: string): Order {
    const item = this.store.getState().orders.find((order) => order.tenantId === tenantId && order.id === id);
    if (!item) notFound("Order not found");
    return item;
  }

  private requireCustomer(idOrEmail: string, tenantId: string): Customer {
    const item = this.store.getState().customers.find(
      (customer) =>
        customer.tenantId === tenantId && (customer.id === idOrEmail || customer.email === idOrEmail.toLowerCase())
    );
    if (!item) notFound("Customer not found");
    return item;
  }
}

function createdAt(): string {
  return new Date().toISOString();
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}
