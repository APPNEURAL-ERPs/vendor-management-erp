import { DataStore } from "./core/datastore";
import {
  DeliveryOrder,
  DeliveryStatus,
  DeliveryType,
  Priority,
  Shipment,
  TrackingEvent,
  Driver,
  Route,
  RouteWaypoint,
  ProofOfDelivery,
  DeliveryZone,
  DeliverySchedule,
  DeliveryCost,
  DeliverySLA,
  DeliveryIssue,
  DeliveryEvent,
  DeliveryOverview,
  RequestActor,
  DeliveryItem
} from "./domain";
import { badRequest, notFound, conflict } from "./core/errors";
import { newId, nowIso, generateTrackingNumber, generateOrderId, generateShipmentId, plusDays } from "./core/id";
import { clone, ensureObject, optionalObject, ensureString, optionalString, ensureNumber, optionalNumber, ensureBoolean, ensureArray, pickQuery, countBy, groupBy, sortBy } from "./core/utils";

export class DeliveryService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "DeliveryOS service is ready";
  }

  overview(actor: RequestActor): DeliveryOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    
    const orders = state.orders.filter(item => item.tenantId === tenant);
    const shipments = state.shipments.filter(item => item.tenantId === tenant);
    const drivers = state.drivers.filter(item => item.tenantId === tenant);
    const routes = state.routes.filter(item => item.tenantId === tenant);
    const proofs = state.proofs.filter(item => item.tenantId === tenant);
    
    return {
      orders: {
        total: orders.length,
        byStatus: countBy(orders, "status"),
        byType: countBy(orders, "type")
      },
      shipments: {
        total: shipments.length,
        inTransit: shipments.filter(s => ["in_transit", "out_for_delivery"].includes(s.status)).length,
        delivered: shipments.filter(s => s.status === "delivered").length,
        failed: shipments.filter(s => s.status === "failed").length
      },
      drivers: {
        total: drivers.length,
        available: drivers.filter(d => d.status === "available").length,
        onDelivery: drivers.filter(d => d.status === "on_delivery").length
      },
      routes: {
        total: routes.length,
        completed: routes.filter(r => r.status === "completed").length,
        inProgress: routes.filter(r => r.status === "in_progress").length
      },
      proofOfDelivery: {
        total: proofs.length,
        withProof: proofs.length,
        withoutProof: 0
      },
      sla: {
        onTime: orders.filter(o => o.status === "delivered").length,
        delayed: orders.filter(o => o.status === "failed").length,
        onTimePercent: 0
      }
    };
  }

  listOrders(actor: RequestActor, query?: URLSearchParams): DeliveryOrder[] {
    const status = pickQuery(query, "status");
    const type = pickQuery(query, "type");
    const search = pickQuery(query, "search")?.toLowerCase();
    
    return clone(this.store.getState().orders.filter(item => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && status !== "all" && item.status !== status) return false;
      if (type && item.type !== type) return false;
      if (search && !`${item.orderId} ${item.customerName} ${item.source} ${item.destination}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getOrder(id: string, actor: RequestActor): DeliveryOrder {
    const order = this.store.getState().orders.find(item => item.id === id && item.tenantId === actor.tenantId);
    if (!order) notFound("Order not found");
    return clone(order);
  }

  createOrder(input: unknown, actor: RequestActor): DeliveryOrder {
    const body = ensureObject(input, "order");
    const state = this.store.getState();
    
    const order: DeliveryOrder = {
      id: newId("order"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      orderId: generateOrderId(),
      type: String(body.type ?? "physical") as DeliveryType,
      status: "draft",
      priority: String(body.priority ?? "medium") as Priority,
      source: ensureString(body.source, "order.source"),
      destination: ensureString(body.destination, "order.destination"),
      customerName: ensureString(body.customerName, "order.customerName"),
      customerPhone: optionalString(body.customerPhone),
      customerEmail: optionalString(body.customerEmail),
      items: ensureArray<DeliveryItem>(body.items, "order.items", []),
      totalAmount: optionalNumber(body.totalAmount),
      deliveryFee: optionalNumber(body.deliveryFee),
      scheduledDate: optionalString(body.scheduledDate),
      notes: optionalString(body.notes),
      metadata: optionalObject(body.metadata)
    };
    
    state.orders.push(order);
    this.store.save();
    this.store.audit(actor, "order.create", "order", order.id, undefined, order);
    this.emitEvent("delivery.created", { orderId: order.id, orderNumber: order.orderId, type: order.type }, actor);
    
    return clone(order);
  }

  updateOrder(id: string, input: unknown, actor: RequestActor): DeliveryOrder {
    const body = ensureObject(input, "order");
    const state = this.store.getState();
    const order = state.orders.find(item => item.id === id && item.tenantId === actor.tenantId);
    if (!order) notFound("Order not found");
    
    const before = clone(order);
    
    if (body.status) order.status = body.status as DeliveryStatus;
    if (body.priority) order.priority = body.priority as Priority;
    if (body.source !== undefined) order.source = String(body.source);
    if (body.destination !== undefined) order.destination = String(body.destination);
    if (body.customerName !== undefined) order.customerName = String(body.customerName);
    if (body.customerPhone !== undefined) order.customerPhone = String(body.customerPhone);
    if (body.deliveryFee !== undefined) order.deliveryFee = Number(body.deliveryFee);
    if (body.scheduledDate !== undefined) order.scheduledDate = String(body.scheduledDate);
    if (body.driverId !== undefined) order.driverId = String(body.driverId);
    if (body.shipmentId !== undefined) order.shipmentId = String(body.shipmentId);
    if (body.proofId !== undefined) order.proofId = String(body.proofId);
    if (body.notes !== undefined) order.notes = String(body.notes);
    if (body.metadata) order.metadata = { ...order.metadata, ...optionalObject(body.metadata) };
    
    order.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "order.update", "order", order.id, before, order);
    
    return clone(order);
  }

  deleteOrder(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const index = state.orders.findIndex(item => item.id === id && item.tenantId === actor.tenantId);
    if (index === -1) notFound("Order not found");
    
    const before = state.orders[index];
    state.orders.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "order.delete", "order", id, before, undefined);
  }

  assignDriver(orderId: string, driverId: string, actor: RequestActor): DeliveryOrder {
    const state = this.store.getState();
    const order = state.orders.find(item => item.id === orderId && item.tenantId === actor.tenantId);
    if (!order) notFound("Order not found");
    
    const driver = state.drivers.find(item => item.id === driverId && item.tenantId === actor.tenantId);
    if (!driver) notFound("Driver not found");
    
    const before = clone(order);
    order.driverId = driverId;
    order.status = "assigned";
    order.updatedAt = nowIso();
    
    this.store.save();
    this.store.audit(actor, "order.assign_driver", "order", order.id, before, order);
    this.emitEvent("delivery.assigned", { orderId: order.id, driverId }, actor);
    
    return clone(order);
  }

  dispatchOrder(orderId: string, input: unknown, actor: RequestActor): Shipment {
    const body = optionalObject(input);
    const state = this.store.getState();
    const order = state.orders.find(item => item.id === orderId && item.tenantId === actor.tenantId);
    if (!order) notFound("Order not found");
    
    const trackingNumber = generateTrackingNumber();
    
    const shipment: Shipment = {
      id: newId("shipment"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      shipmentId: generateShipmentId(),
      orderId: order.id,
      trackingNumber,
      courierName: optionalString(body.courierName),
      courierPartner: optionalString(body.courierPartner),
      pickupDate: nowIso(),
      expectedDeliveryDate: optionalString(body.expectedDeliveryDate) ?? plusDays(3).toISOString(),
      status: "picked_up",
      driverId: order.driverId,
      events: [],
      metadata: optionalObject(body.metadata)
    };
    
    const before = clone(order);
    order.shipmentId = shipment.id;
    order.trackingNumber = trackingNumber;
    order.status = "picked_up";
    order.updatedAt = nowIso();
    
    state.shipments.push(shipment);
    this.addTrackingEvent(shipment.id, "dispatched", "Order dispatched from source", body.pickupLocation ? String(body.pickupLocation) : order.source, actor);
    
    this.store.save();
    this.store.audit(actor, "order.dispatch", "order", order.id, before, order);
    this.emitEvent("delivery.dispatched", { orderId: order.id, shipmentId: shipment.id, trackingNumber }, actor);
    
    return clone(shipment);
  }

  updateShipmentStatus(shipmentId: string, status: DeliveryStatus, location: string, actor: RequestActor): Shipment {
    const state = this.store.getState();
    const shipment = state.shipments.find(item => item.id === shipmentId && item.tenantId === actor.tenantId);
    if (!shipment) notFound("Shipment not found");
    
    const order = state.orders.find(item => item.id === shipment.orderId && item.tenantId === actor.tenantId);
    
    const before = clone(shipment);
    shipment.status = status;
    shipment.updatedAt = nowIso();
    if (location) shipment.currentLocation = location;
    if (status === "delivered") shipment.actualDeliveryDate = nowIso();
    
    if (order) {
      const beforeOrder = clone(order);
      order.status = status;
      order.updatedAt = nowIso();
      if (status === "delivered") {
        order.deliveredDate = nowIso();
        order.proofId = this.getLatestProofId(shipment.id, actor.tenantId);
      }
      this.store.audit(actor, "order.update_status", "order", order.id, beforeOrder, order);
    }
    
    const eventType = status === "in_transit" ? "In Transit" :
                      status === "out_for_delivery" ? "Out for Delivery" :
                      status === "delivered" ? "Delivered" :
                      status === "failed" ? "Delivery Failed" : status;
    
    this.addTrackingEvent(shipment.id, eventType, `Status updated to ${status}`, location, actor);
    
    this.store.save();
    this.store.audit(actor, "shipment.update_status", "shipment", shipment.id, before, shipment);
    this.emitEvent(`delivery.${status}`, { shipmentId: shipment.id, orderId: shipment.orderId, location }, actor);
    
    return clone(shipment);
  }

  listShipments(actor: RequestActor, query?: URLSearchParams): Shipment[] {
    const status = pickQuery(query, "status");
    const driverId = pickQuery(query, "driverId");
    
    return clone(this.store.getState().shipments.filter(item => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && status !== "all" && item.status !== status) return false;
      if (driverId && item.driverId !== driverId) return false;
      return true;
    }));
  }

  getShipment(id: string, actor: RequestActor): Shipment {
    const shipment = this.store.getState().shipments.find(item => item.id === id && item.tenantId === actor.tenantId);
    if (!shipment) notFound("Shipment not found");
    return clone(shipment);
  }

  getShipmentTracking(id: string, actor: RequestActor): TrackingEvent[] {
    const shipment = this.store.getState().shipments.find(item => item.id === id && item.tenantId === actor.tenantId);
    if (!shipment) notFound("Shipment not found");
    
    return clone(this.store.getState().trackingEvents.filter(item => item.shipmentId === id && item.tenantId === actor.tenantId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }

  private addTrackingEvent(shipmentId: string, eventType: string, description: string, location?: string, actor?: RequestActor): TrackingEvent {
    const event: TrackingEvent = {
      id: newId("event"),
      tenantId: actor?.tenantId ?? "system",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      shipmentId,
      eventType,
      description,
      location,
      timestamp: nowIso(),
      performedBy: actor?.userId,
      metadata: {}
    };
    this.store.getState().trackingEvents.push(event);
    return event;
  }

  private getLatestProofId(shipmentId: string, tenantId: string): string | undefined {
    const proofs = this.store.getState().proofs.filter(p => p.shipmentId === shipmentId && p.tenantId === tenantId);
    return proofs.length > 0 ? proofs[proofs.length - 1].id : undefined;
  }

  listDrivers(actor: RequestActor, query?: URLSearchParams): Driver[] {
    const status = pickQuery(query, "status");
    const search = pickQuery(query, "search")?.toLowerCase();
    
    return clone(this.store.getState().drivers.filter(item => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && status !== "all" && item.status !== status) return false;
      if (search && !`${item.driverId} ${item.name} ${item.phone}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getDriver(id: string, actor: RequestActor): Driver {
    const driver = this.store.getState().drivers.find(item => item.id === id && item.tenantId === actor.tenantId);
    if (!driver) notFound("Driver not found");
    return clone(driver);
  }

  createDriver(input: unknown, actor: RequestActor): Driver {
    const body = ensureObject(input, "driver");
    const state = this.store.getState();
    
    const driver: Driver = {
      id: newId("driver"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      driverId: `DRV-${Date.now().toString(36).toUpperCase()}`,
      name: ensureString(body.name, "driver.name"),
      email: optionalString(body.email),
      phone: ensureString(body.phone, "driver.phone"),
      status: String(body.status ?? "available") as Driver["status"],
      vehicleType: optionalString(body.vehicleType),
      vehicleNumber: optionalString(body.vehicleNumber),
      currentLocation: body.currentLocation ? {
        lat: ensureNumber(body.currentLocation.lat, "currentLocation.lat"),
        lng: ensureNumber(body.currentLocation.lng, "currentLocation.lng")
      } : undefined,
      zoneId: optionalString(body.zoneId),
      metadata: optionalObject(body.metadata)
    };
    
    state.drivers.push(driver);
    this.store.save();
    this.store.audit(actor, "driver.create", "driver", driver.id, undefined, driver);
    
    return clone(driver);
  }

  updateDriverStatus(id: string, status: Driver["status"], actor: RequestActor): Driver {
    const state = this.store.getState();
    const driver = state.drivers.find(item => item.id === id && item.tenantId === actor.tenantId);
    if (!driver) notFound("Driver not found");
    
    const before = clone(driver);
    driver.status = status;
    driver.updatedAt = nowIso();
    
    this.store.save();
    this.store.audit(actor, "driver.update_status", "driver", driver.id, before, driver);
    
    return clone(driver);
  }

  listRoutes(actor: RequestActor, query?: URLSearchParams): Route[] {
    const status = pickQuery(query, "status");
    const driverId = pickQuery(query, "driverId");
    
    return clone(this.store.getState().routes.filter(item => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && status !== "all" && item.status !== status) return false;
      if (driverId && item.driverId !== driverId) return false;
      return true;
    }));
  }

  getRoute(id: string, actor: RequestActor): Route {
    const route = this.store.getState().routes.find(item => item.id === id && item.tenantId === actor.tenantId);
    if (!route) notFound("Route not found");
    return clone(route);
  }

  createRoute(input: unknown, actor: RequestActor): Route {
    const body = ensureObject(input, "route");
    const state = this.store.getState();
    
    const driver = state.drivers.find(item => item.id === String(body.driverId) && item.tenantId === actor.tenantId);
    if (!driver) notFound("Driver not found");
    
    const route: Route = {
      id: newId("route"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      routeId: `RTE-${Date.now().toString(36).toUpperCase()}`,
      name: ensureString(body.name, "route.name"),
      driverId: driver.id,
      status: "planned",
      startLocation: ensureString(body.startLocation, "route.startLocation"),
      endLocation: optionalString(body.endLocation),
      waypoints: ensureArray<RouteWaypoint>(body.waypoints, "route.waypoints", []),
      estimatedDistance: optionalNumber(body.estimatedDistance),
      estimatedDuration: optionalNumber(body.estimatedDuration),
      scheduledDate: ensureString(body.scheduledDate, "route.scheduledDate"),
      orders: ensureArray<string>(body.orders, "route.orders", []),
      metadata: optionalObject(body.metadata)
    };
    
    state.routes.push(route);
    this.store.save();
    this.store.audit(actor, "route.create", "route", route.id, undefined, route);
    
    return clone(route);
  }

  addProof(input: unknown, actor: RequestActor): ProofOfDelivery {
    const body = ensureObject(input, "proof");
    const state = this.store.getState();
    
    const shipment = state.shipments.find(item => item.id === String(body.shipmentId) && item.tenantId === actor.tenantId);
    if (!shipment) notFound("Shipment not found");
    
    const order = state.orders.find(item => item.id === shipment.orderId && item.tenantId === actor.tenantId);
    if (!order) notFound("Order not found");
    
    const proof: ProofOfDelivery = {
      id: newId("proof"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      proofId: `POD-${Date.now().toString(36).toUpperCase()}`,
      shipmentId: shipment.id,
      orderId: order.id,
      type: String(body.type ?? "signature") as ProofOfDelivery["type"],
      recipientName: optionalString(body.recipientName),
      recipientSignature: optionalString(body.recipientSignature),
      photoUrl: optionalString(body.photoUrl),
      otpVerified: ensureBoolean(body.otpVerified, false),
      geoLocation: body.geoLocation ? {
        lat: ensureNumber(body.geoLocation.lat, "geoLocation.lat"),
        lng: ensureNumber(body.geoLocation.lng, "geoLocation.lng")
      } : undefined,
      timestamp: nowIso(),
      notes: optionalString(body.notes),
      deliveredBy: actor.userId,
      metadata: optionalObject(body.metadata)
    };
    
    state.proofs.push(proof);
    
    if (order.proofId) {
      order.proofId = proof.id;
    } else {
      order.proofId = proof.id;
    }
    
    this.updateShipmentStatus(shipment.id, "delivered", body.location ? String(body.location) : order.destination, actor);
    
    this.store.save();
    this.store.audit(actor, "proof.create", "proof", proof.id, undefined, proof);
    this.emitEvent("delivery.confirmed", { orderId: order.id, proofId: proof.id }, actor);
    
    return clone(proof);
  }

  listProofs(actor: RequestActor, query?: URLSearchParams): ProofOfDelivery[] {
    const shipmentId = pickQuery(query, "shipmentId");
    const orderId = pickQuery(query, "orderId");
    
    return clone(this.store.getState().proofs.filter(item => {
      if (item.tenantId !== actor.tenantId) return false;
      if (shipmentId && item.shipmentId !== shipmentId) return false;
      if (orderId && item.orderId !== orderId) return false;
      return true;
    }));
  }

  createIssue(input: unknown, actor: RequestActor): DeliveryIssue {
    const body = ensureObject(input, "issue");
    const state = this.store.getState();
    
    const issue: DeliveryIssue = {
      id: newId("issue"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      issueId: `ISU-${Date.now().toString(36).toUpperCase()}`,
      orderId: ensureString(body.orderId, "issue.orderId"),
      shipmentId: optionalString(body.shipmentId),
      type: ensureString(body.type, "issue.type") as DeliveryIssue["type"],
      status: "open",
      priority: String(body.priority ?? "medium") as Priority,
      description: ensureString(body.description, "issue.description"),
      assignedTo: optionalString(body.assignedTo),
      metadata: optionalObject(body.metadata)
    };
    
    state.issues.push(issue);
    this.store.save();
    this.store.audit(actor, "issue.create", "issue", issue.id, undefined, issue);
    
    return clone(issue);
  }

  listIssues(actor: RequestActor, query?: URLSearchParams): DeliveryIssue[] {
    const status = pickQuery(query, "status");
    const orderId = pickQuery(query, "orderId");
    
    return clone(this.store.getState().issues.filter(item => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && status !== "all" && item.status !== status) return false;
      if (orderId && item.orderId !== orderId) return false;
      return true;
    }));
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter(item => item.tenantId === actor.tenantId));
  }

  listEvents(actor: RequestActor) {
    return clone(this.store.getState().events.filter(item => item.tenantId === actor.tenantId));
  }

  private emitEvent(type: string, data: Record<string, unknown>, actor: RequestActor): DeliveryEvent {
    const event: DeliveryEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "DeliveryOS",
      data,
      correlationId: data.orderId as string | undefined
    };
    this.store.getState().events.unshift(event);
    return event;
  }
}
