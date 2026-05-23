import { DeliveryState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, plusDays } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): DeliveryState {
  const state = emptyState();
  const createdAt = nowIso();

  state.drivers.push(
    {
      id: "driver_ajay",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      driverId: "DRV-AJAY-001",
      name: "Ajay Sharma",
      email: "ajay.sharma@appneural.com",
      phone: "+91-9876543210",
      status: "available",
      vehicleType: "Bike",
      vehicleNumber: "RJ14-AB-1234",
      currentLocation: { lat: 26.9124, lng: 75.7873 },
      zoneId: "zone_jaipur",
      ratings: 4.8,
      totalDeliveries: 156,
      metadata: {}
    },
    {
      id: "driver_priya",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      driverId: "DRV-PRIYA-002",
      name: "Priya Patel",
      email: "priya.patel@appneural.com",
      phone: "+91-9876543211",
      status: "on_delivery",
      vehicleType: "Scooter",
      vehicleNumber: "RJ45-CD-5678",
      currentLocation: { lat: 26.9196, lng: 75.7878 },
      zoneId: "zone_jaipur",
      ratings: 4.6,
      totalDeliveries: 203,
      metadata: {}
    },
    {
      id: "driver_rajesh",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      driverId: "DRV-RAJESH-003",
      name: "Rajesh Kumar",
      email: "rajesh.kumar@appneural.com",
      phone: "+91-9876543212",
      status: "available",
      vehicleType: "Car",
      vehicleNumber: "RJ41-EF-9012",
      currentLocation: { lat: 26.9250, lng: 75.7900 },
      zoneId: "zone_jaipur",
      ratings: 4.9,
      totalDeliveries: 312,
      metadata: {}
    }
  );

  state.orders.push(
    {
      id: "order_workshop_kit_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderId: "ORD-WKS-001",
      type: "physical",
      status: "in_transit",
      priority: "high",
      source: "APPNEURAL Warehouse, Mumbai",
      destination: "Udaipur Training Center, Rajasthan",
      customerName: "Training Department",
      customerPhone: "+91-9829012345",
      customerEmail: "training@appneural.com",
      items: [
        {
          itemId: "KIT-AIWORKSHOP-001",
          name: "AI Workshop Kit",
          quantity: 80,
          description: "Complete workshop kit with materials",
          weight: 2.5,
          metadata: {}
        }
      ],
      totalAmount: 80000,
      deliveryFee: 1500,
      scheduledDate: plusDays(1).toISOString(),
      driverId: "driver_priya",
      trackingNumber: "DEL1ABC123",
      notes: "Deliver before workshop start at 9 AM",
      metadata: {}
    },
    {
      id: "order_certificate_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderId: "ORD-CERT-002",
      type: "digital",
      status: "delivered",
      priority: "medium",
      source: "DocumentOS - Certificate Generator",
      destination: "student@appneural.com",
      customerName: "Rahul Verma",
      customerEmail: "rahul.verma@appneural.com",
      items: [
        {
          itemId: "CERT-AI101-001",
          name: "AI Fundamentals Certificate",
          quantity: 1,
          description: "Certificate of completion",
          metadata: {}
        }
      ],
      totalAmount: 0,
      deliveryFee: 0,
      deliveredDate: createdAt,
      metadata: {}
    },
    {
      id: "order_laptop_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderId: "ORD-ASSET-003",
      type: "physical",
      status: "assigned",
      priority: "urgent",
      source: "IT Department",
      destination: "Floor 3, Building B, Jaipur Office",
      customerName: "Neha Singh",
      customerPhone: "+91-9876543299",
      customerEmail: "neha.singh@appneural.com",
      items: [
        {
          itemId: "LAPTOP-DELL-001",
          name: "Dell XPS 15 Laptop",
          quantity: 1,
          description: "New employee laptop",
          weight: 2.1,
          metadata: {}
        }
      ],
      totalAmount: 135000,
      deliveryFee: 0,
      scheduledDate: plusDays(0).toISOString(),
      driverId: "driver_rajesh",
      metadata: {}
    },
    {
      id: "order_project_files_004",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderId: "ORD-PROJ-004",
      type: "project",
      status: "requested",
      priority: "high",
      source: "ProjectOS - Website Development",
      destination: "client@techcorp.com",
      customerName: "TechCorp Solutions",
      customerEmail: "client@techcorp.com",
      items: [
        {
          itemId: "FILES-WEBSITE-001",
          name: "Website Source Code & Documentation",
          quantity: 1,
          description: "Complete project handover package",
          metadata: {}
        },
        {
          itemId: "DOCS-HANDOVER-001",
          name: "Handover Documentation",
          quantity: 1,
          description: "Project completion reports",
          metadata: {}
        }
      ],
      totalAmount: 500000,
      deliveryFee: 0,
      notes: "Schedule delivery after client acceptance",
      metadata: {}
    },
    {
      id: "order_service_005",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderId: "ORD-SVC-005",
      type: "service",
      status: "draft",
      priority: "medium",
      source: "SupportOS - AI Automation Setup",
      destination: "office@appneural.com",
      customerName: "Operations Team",
      customerEmail: "ops@appneural.com",
      items: [
        {
          itemId: "SVC-AI-AUTO-001",
          name: "AI Workflow Automation Service",
          quantity: 1,
          description: "Setup and configure AI automation workflows",
          metadata: {}
        }
      ],
      totalAmount: 25000,
      deliveryFee: 0,
      notes: "Service delivery - not physical shipment",
      metadata: {}
    }
  );

  state.shipments.push(
    {
      id: "shipment_shp001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      shipmentId: "SHP-ABC123-001",
      orderId: "order_workshop_kit_001",
      trackingNumber: "DEL1ABC123",
      courierName: "Internal Delivery",
      courierPartner: "APPNEURAL Express",
      pickupDate: createdAt,
      expectedDeliveryDate: plusDays(1).toISOString(),
      status: "in_transit",
      currentLocation: "Jaipur Highway",
      driverId: "driver_priya",
      events: [],
      metadata: {}
    },
    {
      id: "shipment_shp002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      shipmentId: "SHP-DEF456-002",
      orderId: "order_laptop_003",
      trackingNumber: "DEL2DEF456",
      courierName: "Internal Delivery",
      courierPartner: "APPNEURAL Express",
      pickupDate: createdAt,
      expectedDeliveryDate: plusDays(0).toISOString(),
      status: "assigned",
      currentLocation: "IT Department",
      driverId: "driver_rajesh",
      events: [],
      metadata: {}
    }
  );

  state.trackingEvents.push(
    {
      id: "event_track_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      shipmentId: "shipment_shp001",
      eventType: "Dispatched",
      description: "Package dispatched from Mumbai warehouse",
      location: "Mumbai, Maharashtra",
      timestamp: createdAt,
      metadata: {}
    },
    {
      id: "event_track_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      shipmentId: "shipment_shp001",
      eventType: "In Transit",
      description: "Package in transit to destination",
      location: "Jaipur Highway, Rajasthan",
      timestamp: nowIso(),
      metadata: {}
    }
  );

  state.proofs.push(
    {
      id: "proof_pod001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      proofId: "POD-CERT001",
      shipmentId: "shipment_shp002",
      orderId: "order_certificate_002",
      type: "email_confirmation",
      recipientName: "Rahul Verma",
      timestamp: createdAt,
      notes: "Digital delivery - email confirmation received",
      deliveredBy: "system",
      metadata: {}
    }
  );

  state.zones.push(
    {
      id: "zone_jaipur",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      zoneId: "ZONE-JP-001",
      name: "Jaipur Metro Area",
      pinCodes: ["302001", "302002", "302003", "302004", "302005"],
      city: "Jaipur",
      state: "Rajasthan",
      freeDeliveryRadius: 5,
      deliveryFee: 50,
      estimatedDeliveryDays: 1,
      status: "active"
    },
    {
      id: "zone_udaipur",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      zoneId: "ZONE-UD-001",
      name: "Udaipur Region",
      pinCodes: ["313001", "313002", "313011"],
      city: "Udaipur",
      state: "Rajasthan",
      freeDeliveryRadius: 10,
      deliveryFee: 150,
      estimatedDeliveryDays: 2,
      status: "active"
    }
  );

  state.slas.push(
    {
      id: "sla_physical_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      slaId: "SLA-PHY-001",
      name: "Physical Delivery SLA",
      deliveryType: "physical",
      dispatchSlaHours: 24,
      deliverySlaHours: 72,
      pickupSlaHours: 4,
      proofCaptureSlaMinutes: 30,
      status: "active"
    },
    {
      id: "sla_digital_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      slaId: "SLA-DIG-001",
      name: "Digital Delivery SLA",
      deliveryType: "digital",
      deliverySlaHours: 1,
      proofCaptureSlaMinutes: 10,
      status: "active"
    }
  );

  state.issues.push(
    {
      id: "issue_isu001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      issueId: "ISU-DELAY-001",
      orderId: "order_workshop_kit_001",
      shipmentId: "shipment_shp001",
      type: "delay",
      status: "in_progress",
      priority: "high",
      description: "Delivery delayed due to traffic on highway",
      assignedTo: "driver_priya",
      metadata: {}
    }
  );

  state.events.push({
    id: "event_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "deliveryos.seeded",
    source: "DeliveryOS",
    data: { message: "DeliveryOS demo data seeded" }
  });

  return state;
}
