import { DataStore } from "./core/datastore";
import {
  MarketplaceBuyer,
  MarketplaceCart,
  MarketplaceCategory,
  MarketplaceCommission,
  MarketplaceEvent,
  MarketplaceInstall,
  MarketplaceLicense,
  MarketplaceListing,
  MarketplaceOrder,
  MarketplaceOverview,
  MarketplacePayout,
  MarketplaceReview,
  MarketplaceSeller,
  MarketplaceBundle,
  RequestActor
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

export class MarketplaceService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "MarketplaceOS service is ready";
  }

  overview(actor: RequestActor): MarketplaceOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const orders = state.orders.filter((item) => item.tenantId === tenant);
    const completedOrders = orders.filter((item) => item.status === "completed");
    
    return {
      listings: {
        total: state.listings.filter((item) => item.tenantId === tenant).length,
        active: state.listings.filter((item) => item.tenantId === tenant && item.status === "published").length,
        pending: state.listings.filter((item) => item.tenantId === tenant && (item.status === "submitted" || item.status === "under_review")).length
      },
      sellers: {
        total: state.sellers.filter((item) => item.tenantId === tenant).length,
        active: state.sellers.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      buyers: {
        total: state.buyers.filter((item) => item.tenantId === tenant).length,
        purchases: state.buyers.filter((item) => item.tenantId === tenant).reduce((sum, b) => sum + b.purchaseCount, 0)
      },
      orders: {
        total: orders.length,
        completed: completedOrders.length,
        pending: orders.filter((item) => item.status === "pending").length,
        revenue: completedOrders.reduce((sum, o) => sum + o.total, 0),
        refunds: orders.filter((item) => item.status === "refunded").length
      },
      reviews: {
        total: state.reviews.filter((item) => item.tenantId === tenant).length,
        averageRating: this.calculateAverageRating(state.reviews.filter((item) => item.tenantId === tenant && item.status === "approved"))
      },
      payouts: {
        total: state.payouts.filter((item) => item.tenantId === tenant).length,
        paid: state.payouts.filter((item) => item.tenantId === tenant && item.status === "paid").length,
        pending: state.payouts.filter((item) => item.tenantId === tenant && item.status === "pending").length
      },
      installs: {
        total: state.installs.filter((item) => item.tenantId === tenant).length,
        active: state.installs.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      revenue: {
        total: completedOrders.reduce((sum, o) => sum + o.total, 0),
        platform: completedOrders.reduce((sum, o) => sum + o.platformFee, 0),
        seller: completedOrders.reduce((sum, o) => sum + o.sellerPayout, 0)
      }
    };
  }

  listCategories(actor: RequestActor): MarketplaceCategory[] {
    return clone(this.store.getState().categories.filter((item) => item.tenantId === actor.tenantId));
  }

  createCategory(input: unknown, actor: RequestActor): MarketplaceCategory {
    const body = ensureObject(input, "category");
    const state = this.store.getState();
    const key = ensureString(body.key, "category.key");
    if (state.categories.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Category key '${key}' already exists`);
    }
    const category: MarketplaceCategory = {
      id: newId("cat"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "category.name"),
      description: body.description ? String(body.description) : undefined,
      parentId: body.parentId ? String(body.parentId) : undefined,
      status: String(body.status ?? "active") as any,
      sortOrder: ensureNumber(body.sortOrder, "category.sortOrder", 0),
      icon: body.icon ? String(body.icon) : undefined,
      metadata: optionalObject(body.metadata)
    };
    state.categories.push(category);
    this.store.save();
    this.store.audit(actor, "category.create", "category", category.id, undefined, category);
    return clone(category);
  }

  listListings(actor: RequestActor, query?: URLSearchParams): MarketplaceListing[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const categoryId = pickQuery(query, "categoryId");
    const sellerId = pickQuery(query, "sellerId");
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");
    const featured = pickQuery(query, "featured");
    const trending = pickQuery(query, "trending");
    
    return clone(this.store.getState().listings.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (categoryId && item.categoryId !== categoryId) return false;
      if (sellerId && item.sellerId !== sellerId) return false;
      if (type && item.type !== type) return false;
      if (status && item.status !== status) return false;
      if (featured === "true" && !item.isFeatured) return false;
      if (trending === "true" && !item.isTrending) return false;
      return true;
    }));
  }

  getListing(id: string, actor: RequestActor): MarketplaceListing {
    const listing = this.store.getState().listings.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!listing) notFound("Listing not found");
    return clone(listing);
  }

  createListing(input: unknown, actor: RequestActor): MarketplaceListing {
    const body = ensureObject(input, "listing");
    const state = this.store.getState();
    const key = ensureString(body.key, "listing.key");
    if (state.listings.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Listing key '${key}' already exists`);
    }
    const seller = this.requireSeller(String(body.sellerId), actor.tenantId);
    const listing: MarketplaceListing = {
      id: newId("listing"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "listing.name"),
      description: body.description ? String(body.description) : undefined,
      categoryId: body.categoryId ? String(body.categoryId) : undefined,
      sellerId: seller.id,
      status: String(body.status ?? "draft") as any,
      type: String(body.type ?? "tool") as any,
      tags: ensureArray<string>(body.tags, "listing.tags"),
      pricing: this.parsePricing(body.pricing),
      compatibility: optionalObject(body.compatibility),
      media: ensureArray(body.media, "listing.media"),
      version: String(body.version ?? "1.0.0"),
      license: String(body.license ?? "marketplace_paid") as any,
      supportPolicy: body.supportPolicy ? String(body.supportPolicy) : undefined,
      refundPolicy: body.refundPolicy ? String(body.refundPolicy) : undefined,
      installInstructions: body.installInstructions ? String(body.installInstructions) : undefined,
      installCount: 0,
      purchaseCount: 0,
      isFeatured: ensureBoolean(body.isFeatured, false),
      isTrending: ensureBoolean(body.isTrending, false),
      metadata: optionalObject(body.metadata)
    };
    state.listings.push(listing);
    this.store.save();
    this.store.audit(actor, "listing.create", "listing", listing.id, undefined, listing);
    return clone(listing);
  }

  updateListing(id: string, input: unknown, actor: RequestActor): MarketplaceListing {
    const body = ensureObject(input, "listing");
    const state = this.store.getState();
    const listing = state.listings.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!listing) notFound("Listing not found");
    const before = clone(listing);
    
    if (body.name) listing.name = String(body.name);
    if (body.description) listing.description = String(body.description);
    if (body.categoryId !== undefined) listing.categoryId = body.categoryId ? String(body.categoryId) : undefined;
    if (body.status) listing.status = String(body.status) as any;
    if (body.tags) listing.tags = ensureArray<string>(body.tags, "listing.tags");
    if (body.pricing) listing.pricing = this.parsePricing(body.pricing);
    if (body.version) listing.version = String(body.version);
    if (body.isFeatured !== undefined) listing.isFeatured = ensureBoolean(body.isFeatured);
    if (body.isTrending !== undefined) listing.isTrending = ensureBoolean(body.isTrending);
    listing.updatedAt = nowIso();
    
    this.store.save();
    this.store.audit(actor, "listing.update", "listing", listing.id, before, listing);
    return clone(listing);
  }

  listSellers(actor: RequestActor, query?: URLSearchParams): MarketplaceSeller[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const type = pickQuery(query, "type");
    
    return clone(this.store.getState().sellers.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.key} ${item.name} ${item.email}`.toLowerCase().includes(search)) return false;
      if (status && item.status !== status) return false;
      if (type && item.type !== type) return false;
      return true;
    }));
  }

  getSeller(id: string, actor: RequestActor): MarketplaceSeller {
    const seller = this.store.getState().sellers.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!seller) notFound("Seller not found");
    return clone(seller);
  }

  createSeller(input: unknown, actor: RequestActor): MarketplaceSeller {
    const body = ensureObject(input, "seller");
    const state = this.store.getState();
    const key = ensureString(body.key, "seller.key");
    if (state.sellers.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Seller key '${key}' already exists`);
    }
    const seller: MarketplaceSeller = {
      id: newId("seller"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "seller.name"),
      email: ensureString(body.email, "seller.email"),
      status: String(body.status ?? "applied") as any,
      type: String(body.type ?? "partner") as any,
      website: body.website ? String(body.website) : undefined,
      logo: body.logo ? String(body.logo) : undefined,
      bio: body.bio ? String(body.bio) : undefined,
      totalRevenue: 0,
      totalPayouts: 0,
      pendingPayouts: 0,
      rating: 0,
      reviewCount: 0,
      listingCount: 0,
      verified: ensureBoolean(body.verified, false),
      payoutMethod: body.payoutMethod ? {
        type: (String(body.payoutMethod.type ?? "bank") as "bank" | "paypal" | "stripe"),
        last4: body.payoutMethod.last4 ? String(body.payoutMethod.last4) : undefined,
        email: body.payoutMethod.email ? String(body.payoutMethod.email) : undefined
      } : undefined,
      commission: {
        rate: ensureNumber(body.commission?.rate, "seller.commission.rate", 0.2),
        minAmount: ensureNumber(body.commission?.minAmount, "seller.commission.minAmount", 100)
      },
      metadata: optionalObject(body.metadata)
    };
    state.sellers.push(seller);
    this.store.save();
    this.store.audit(actor, "seller.create", "seller", seller.id, undefined, seller);
    return clone(seller);
  }

  listBuyers(actor: RequestActor): MarketplaceBuyer[] {
    return clone(this.store.getState().buyers.filter((item) => item.tenantId === actor.tenantId));
  }

  getBuyer(id: string, actor: RequestActor): MarketplaceBuyer {
    const buyer = this.store.getState().buyers.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!buyer) notFound("Buyer not found");
    return clone(buyer);
  }

  createBuyer(input: unknown, actor: RequestActor): MarketplaceBuyer {
    const body = ensureObject(input, "buyer");
    const state = this.store.getState();
    const buyer: MarketplaceBuyer = {
      id: newId("buyer"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      userId: String(body.userId ?? actor.userId),
      email: ensureString(body.email, "buyer.email"),
      name: ensureString(body.name, "buyer.name"),
      organization: body.organization ? String(body.organization) : undefined,
      purchaseCount: 0,
      totalSpent: 0,
      licenseCount: 0,
      wishlist: [],
      metadata: optionalObject(body.metadata)
    };
    state.buyers.push(buyer);
    this.store.save();
    this.store.audit(actor, "buyer.create", "buyer", buyer.id, undefined, buyer);
    return clone(buyer);
  }

  listOrders(actor: RequestActor, query?: URLSearchParams): MarketplaceOrder[] {
    const buyerId = pickQuery(query, "buyerId");
    const sellerId = pickQuery(query, "sellerId");
    const listingId = pickQuery(query, "listingId");
    const status = pickQuery(query, "status");
    
    return clone(this.store.getState().orders.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (buyerId && item.buyerId !== buyerId) return false;
      if (sellerId && item.sellerId !== sellerId) return false;
      if (listingId && item.listingId !== listingId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getOrder(id: string, actor: RequestActor): MarketplaceOrder {
    const order = this.store.getState().orders.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!order) notFound("Order not found");
    return clone(order);
  }

  createOrder(input: unknown, actor: RequestActor): MarketplaceOrder {
    const body = ensureObject(input, "order");
    const state = this.store.getState();
    const listing = this.requireListing(String(body.listingId), actor.tenantId);
    const seller = this.requireSeller(listing.sellerId, actor.tenantId);
    
    let buyer = state.buyers.find((item) => item.tenantId === actor.tenantId && item.userId === actor.userId);
    if (!buyer) {
      buyer = this.createBuyer({ userId: actor.userId, email: `${actor.userId}@example.com`, name: actor.userId }, actor);
    }
    
    const pricing = listing.pricing;
    const subtotal = pricing.amount ?? 0;
    const platformFee = subtotal * 0.2;
    const sellerPayout = subtotal - platformFee;
    
    const order: MarketplaceOrder = {
      id: newId("order"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      orderNumber: `ORD-${nowIso().replace(/[-:T]/g, "").slice(0, 12)}`,
      buyerId: buyer.id,
      listingId: listing.id,
      sellerId: seller.id,
      status: pricing.type === "free" ? "completed" : "pending",
      pricing: { ...pricing, amount: pricing.amount ?? 0, currency: pricing.currency ?? "INR" },
      quantity: ensureNumber(body.quantity, "order.quantity", 1),
      subtotal,
      platformFee,
      sellerPayout,
      total: subtotal,
      metadata: optionalObject(body.metadata)
    };
    
    state.orders.push(order);
    if (pricing.type === "free") {
      order.completedAt = nowIso();
      this.updateListingMetrics(listing.id, actor.tenantId);
      buyer.purchaseCount++;
      buyer.totalSpent += subtotal;
      seller.totalRevenue += sellerPayout;
    }
    
    this.store.save();
    this.store.audit(actor, "order.create", "order", order.id, undefined, order);
    return clone(order);
  }

  updateOrderStatus(id: string, input: unknown, actor: RequestActor): MarketplaceOrder {
    const body = ensureObject(input, "order");
    const state = this.store.getState();
    const order = state.orders.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!order) notFound("Order not found");
    const before = clone(order);
    
    const newStatus = String(body.status);
    order.status = newStatus as any;
    if (newStatus === "completed") {
      order.completedAt = nowIso();
      const listing = state.listings.find((l) => l.id === order.listingId);
      if (listing) this.updateListingMetrics(listing.id, actor.tenantId);
      const buyer = state.buyers.find((b) => b.id === order.buyerId);
      if (buyer) {
        buyer.purchaseCount++;
        buyer.totalSpent += order.total;
      }
      const seller = state.sellers.find((s) => s.id === order.sellerId);
      if (seller) {
        seller.totalRevenue += order.sellerPayout;
        seller.pendingPayouts += order.sellerPayout;
      }
    }
    order.updatedAt = nowIso();
    
    this.store.save();
    this.store.audit(actor, "order.update", "order", order.id, before, order);
    return clone(order);
  }

  listReviews(actor: RequestActor, query?: URLSearchParams): MarketplaceReview[] {
    const listingId = pickQuery(query, "listingId");
    const status = pickQuery(query, "status");
    const verified = pickQuery(query, "verified");
    
    return clone(this.store.getState().reviews.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (listingId && item.listingId !== listingId) return false;
      if (status && item.status !== status) return false;
      if (verified && String(item.verified) !== verified) return false;
      return true;
    }));
  }

  createReview(input: unknown, actor: RequestActor): MarketplaceReview {
    const body = ensureObject(input, "review");
    const state = this.store.getState();
    const listing = this.requireListing(String(body.listingId), actor.tenantId);
    
    let buyer = state.buyers.find((item) => item.tenantId === actor.tenantId && item.userId === actor.userId);
    if (!buyer) {
      badRequest("Must be a verified buyer to review");
    }
    
    const review: MarketplaceReview = {
      id: newId("review"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      listingId: listing.id,
      buyerId: buyer.id,
      orderId: body.orderId ? String(body.orderId) : "",
      rating: ensureNumber(body.rating, "review.rating"),
      title: body.title ? String(body.title) : undefined,
      content: body.content ? String(body.content) : undefined,
      status: "pending",
      verified: buyer.purchaseCount > 0,
      helpful: 0,
      pros: ensureArray<string>(body.pros, "review.pros"),
      cons: ensureArray<string>(body.cons, "review.cons"),
      version: listing.version,
      metadata: optionalObject(body.metadata)
    };
    
    state.reviews.push(review);
    this.store.save();
    this.store.audit(actor, "review.create", "review", review.id, undefined, review);
    return clone(review);
  }

  listPayouts(actor: RequestActor, query?: URLSearchParams): MarketplacePayout[] {
    const sellerId = pickQuery(query, "sellerId");
    const status = pickQuery(query, "status");
    
    return clone(this.store.getState().payouts.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (sellerId && item.sellerId !== sellerId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createPayout(input: unknown, actor: RequestActor): MarketplacePayout {
    const body = ensureObject(input, "payout");
    const state = this.store.getState();
    const seller = this.requireSeller(String(body.sellerId), actor.tenantId);
    
    const payout: MarketplacePayout = {
      id: newId("payout"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      payoutNumber: `PAY-${nowIso().replace(/[-:T]/g, "").slice(0, 12)}`,
      sellerId: seller.id,
      amount: seller.pendingPayouts,
      currency: "INR",
      status: "pending",
      orders: [],
      fees: 0,
      totalAmount: seller.pendingPayouts,
      metadata: optionalObject(body.metadata)
    };
    
    state.payouts.push(payout);
    seller.pendingPayouts = 0;
    this.store.save();
    this.store.audit(actor, "payout.create", "payout", payout.id, undefined, payout);
    return clone(payout);
  }

  listLicenses(actor: RequestActor, query?: URLSearchParams): MarketplaceLicense[] {
    const buyerId = pickQuery(query, "buyerId");
    const listingId = pickQuery(query, "listingId");
    
    return clone(this.store.getState().licenses.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (buyerId && item.buyerId !== buyerId) return false;
      if (listingId && item.listingId !== listingId) return false;
      return true;
    }));
  }

  createLicense(input: unknown, actor: RequestActor): MarketplaceLicense {
    const body = ensureObject(input, "license");
    const state = this.store.getState();
    const listing = this.requireListing(String(body.listingId), actor.tenantId);
    
    let buyer = state.buyers.find((item) => item.tenantId === actor.tenantId && item.userId === actor.userId);
    if (!buyer) {
      badRequest("Buyer not found. Must have a valid order.");
    }
    
    const license: MarketplaceLicense = {
      id: newId("license"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      licenseKey: `LIC-${newId("key").toUpperCase()}`,
      orderId: String(body.orderId ?? ""),
      listingId: listing.id,
      buyerId: buyer.id,
      sellerId: listing.sellerId,
      status: "active",
      type: String(body.type ?? "personal") as any,
      validUntil: body.validUntil ? String(body.validUntil) : undefined,
      seats: body.seats ? ensureNumber(body.seats, "license.seats", 1) : 1,
      features: ensureArray<string>(body.features, "license.features"),
      metadata: optionalObject(body.metadata)
    };
    
    state.licenses.push(license);
    buyer.licenseCount++;
    this.store.save();
    this.store.audit(actor, "license.create", "license", license.id, undefined, license);
    return clone(license);
  }

  listInstalls(actor: RequestActor, query?: URLSearchParams): MarketplaceInstall[] {
    const listingId = pickQuery(query, "listingId");
    const status = pickQuery(query, "status");
    
    return clone(this.store.getState().installs.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (listingId && item.listingId !== listingId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createInstall(input: unknown, actor: RequestActor): MarketplaceInstall {
    const body = ensureObject(input, "install");
    const state = this.store.getState();
    const listing = this.requireListing(String(body.listingId), actor.tenantId);
    
    let buyer = state.buyers.find((item) => item.tenantId === actor.tenantId && item.userId === actor.userId);
    if (!buyer) {
      badRequest("Buyer not found");
    }
    
    const install: MarketplaceInstall = {
      id: newId("install"),
      tenantId: String(body.tenantId ?? actor.tenantId),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      licenseId: String(body.licenseId ?? ""),
      listingId: listing.id,
      buyerId: buyer.id,
      status: "active",
      version: listing.version,
      installedAt: nowIso(),
      config: optionalObject(body.config),
      metadata: optionalObject(body.metadata)
    };
    
    state.installs.push(install);
    listing.installCount++;
    this.store.save();
    this.store.audit(actor, "install.create", "install", install.id, undefined, install);
    return clone(install);
  }

  listCart(actor: RequestActor): MarketplaceCart | null {
    const cart = this.store.getState().carts.find((item) => item.tenantId === actor.tenantId && item.buyerId === actor.userId);
    return cart ? clone(cart) : null;
  }

  addToCart(input: unknown, actor: RequestActor): MarketplaceCart {
    const body = ensureObject(input, "cart");
    const state = this.store.getState();
    let cart = state.carts.find((item) => item.tenantId === actor.tenantId && item.buyerId === actor.userId);
    
    if (!cart) {
      cart = {
        id: newId("cart"),
        tenantId: actor.tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        buyerId: actor.userId,
        items: [],
        metadata: {}
      };
      state.carts.push(cart);
    }
    
    const listingId = String(body.listingId);
    if (!cart.items.some((item) => item.listingId === listingId)) {
      cart.items.push({
        listingId,
        quantity: ensureNumber(body.quantity, "cart.quantity", 1),
        addedAt: nowIso()
      });
    }
    cart.updatedAt = nowIso();
    
    this.store.save();
    return clone(cart);
  }

  clearCart(actor: RequestActor): void {
    const state = this.store.getState();
    const cartIndex = state.carts.findIndex((item) => item.tenantId === actor.tenantId && item.buyerId === actor.userId);
    if (cartIndex !== -1) {
      state.carts.splice(cartIndex, 1);
      this.store.save();
    }
  }

  search(actor: RequestActor, query?: URLSearchParams): {
    listings: MarketplaceListing[];
    categories: MarketplaceCategory[];
    sellers: MarketplaceSeller[];
  } {
    const q = pickQuery(query, "q")?.toLowerCase() || "";
    const state = this.store.getState();
    
    return {
      listings: clone(state.listings.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (!q) return item.status === "published";
        return item.status === "published" && (
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })),
      categories: clone(state.categories.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (!q) return true;
        return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      })),
      sellers: clone(state.sellers.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (!q) return item.status === "active";
        return item.status === "active" && (
          item.name.toLowerCase().includes(q) ||
          item.key.toLowerCase().includes(q)
        );
      }))
    };
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private requireListing(idOrKey: string, tenantId: string): MarketplaceListing {
    const item = this.store.getState().listings.find((listing) => listing.tenantId === tenantId && (listing.id === idOrKey || listing.key === idOrKey));
    if (!item) notFound("Listing not found");
    return item;
  }

  private requireSeller(idOrKey: string, tenantId: string): MarketplaceSeller {
    const item = this.store.getState().sellers.find((seller) => seller.tenantId === tenantId && (seller.id === idOrKey || seller.key === idOrKey));
    if (!item) notFound("Seller not found");
    return item;
  }

  private parsePricing(input: unknown): any {
    if (!input) return { type: "free", amount: 0, currency: "INR" };
    const pricing = ensureObject(input, "pricing");
    const type = String(pricing.type ?? "free");
    return {
      type,
      amount: pricing.amount !== undefined ? ensureNumber(pricing.amount, "pricing.amount") : (type === "free" ? 0 : undefined),
      currency: String(pricing.currency ?? "INR"),
      interval: pricing.interval ? String(pricing.interval) : undefined
    };
  }

  private updateListingMetrics(listingId: string, tenantId: string): void {
    const state = this.store.getState();
    const listing = state.listings.find((item) => item.id === listingId && item.tenantId === tenantId);
    if (!listing) return;
    listing.purchaseCount++;
    listing.updatedAt = nowIso();
    const reviews = state.reviews.filter((r) => r.listingId === listingId && r.status === "approved");
    if (reviews.length > 0) {
      listing.rating = this.calculateAverageRating(reviews);
      listing.reviewCount = reviews.length;
    }
  }

  private calculateAverageRating(reviews: MarketplaceReview[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }
}
