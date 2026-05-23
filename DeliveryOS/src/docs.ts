export function docs() {
  return {
    name: "DeliveryOS",
    version: "1.0.0",
    description: "Delivery, dispatch, shipment, logistics, fulfillment, handover, route, courier, proof-of-delivery, tracking, and delivery performance management for APPNEURAL.",
    auth: {
      headers: {
        "x-role": "owner | admin | delivery_manager | dispatcher | driver | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      order: "A delivery request or order containing items to be delivered.",
      shipment: "A dispatched package with tracking information.",
      driver: "A delivery partner or agent responsible for deliveries.",
      route: "A planned delivery route for a driver.",
      proof: "Proof of delivery capturing delivery confirmation.",
      tracking: "Real-time tracking events for shipments."
    },
    deliveryTypes: {
      physical: "Physical goods and materials",
      digital: "Digital files, certificates, links",
      service: "Service-based delivery",
      project: "Project deliverables and handover"
    },
    deliveryStatuses: [
      "draft", "requested", "approved", "ready_for_dispatch", "assigned",
      "picked_up", "in_transit", "out_for_delivery", "delivered",
      "failed", "cancelled", "returned", "closed"
    ],
    examples: {
      createOrder: {
        method: "POST",
        path: "/deliveryos/orders",
        headers: { "x-role": "delivery_manager" },
        body: {
          type: "physical",
          source: "Warehouse A",
          destination: "Client Office",
          customerName: "ABC Corp",
          customerPhone: "+91-9876543210",
          items: [{ itemId: "ITEM-001", name: "Product", quantity: 5 }]
        }
      },
      dispatchOrder: {
        method: "POST",
        path: "/deliveryos/orders/:id/dispatch",
        headers: { "x-role": "dispatcher" },
        body: { courierName: "APPNEURAL Express", expectedDeliveryDate: "2024-12-25T18:00:00Z" }
      },
      trackShipment: {
        method: "GET",
        path: "/deliveryos/shipments/:id/tracking",
        headers: { "x-role": "viewer" }
      },
      addProof: {
        method: "POST",
        path: "/deliveryos/proofs",
        headers: { "x-role": "driver" },
        body: {
          shipmentId: "shipment_id",
          type: "signature",
          recipientName: "John Doe",
          recipientSignature: "base64_encoded_signature"
        }
      },
      assignDriver: {
        method: "POST",
        path: "/deliveryos/orders/:id/assign",
        headers: { "x-role": "dispatcher" },
        body: { driverId: "driver_ajay" }
      }
    }
  };
}
