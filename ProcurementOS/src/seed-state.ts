import { ProcurementState } from "./domain";
import { emptyState } from "./core/datastore";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): ProcurementState {
  const state = emptyState();
  const createdAt = nowIso();

  state.vendors.push(
    {
      id: "vendor_acme",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "ACME Supplies",
      contactPerson: "John Doe",
      email: "john@acme.com",
      phone: "+91-9876543210",
      address: "123 Industrial Area, Mumbai",
      category: "Hardware",
      status: "active",
      rating: 4.5,
      paymentTerms: "Net 30",
      bankDetails: "ACME Bank A/C: XXXX1234",
      taxId: "ABCDE1234F",
      notes: "Preferred vendor for hardware"
    },
    {
      id: "vendor_techparts",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "TechParts Inc",
      contactPerson: "Jane Smith",
      email: "jane@techparts.com",
      phone: "+91-9876543211",
      address: "456 Tech Park, Bangalore",
      category: "Electronics",
      status: "active",
      rating: 4.2,
      paymentTerms: "Net 45",
      taxId: "TPXYZ5678G",
      notes: "Good for electronic components"
    },
    {
      id: "vendor_officepro",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Office Pro",
      contactPerson: "Mike Johnson",
      email: "mike@officepro.com",
      phone: "+91-9876543212",
      address: "789 Business Center, Delhi",
      category: "Office Supplies",
      status: "active",
      rating: 4.0,
      paymentTerms: "Net 30",
      taxId: "OPQRS9012H"
    }
  );

  state.purchaseRequests.push(
    {
      id: "pr_laptop_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      requestNumber: "PR-2025-001",
      title: "Laptop Purchase for Engineering",
      description: "5 laptops for new engineering hires",
      requestedBy: "user_engineering",
      department: "Engineering",
      project: "Q3 Expansion",
      category: "Hardware",
      items: [
        {
          id: "item_pr001_1",
          description: "Laptop - Dell XPS 15",
          quantity: 5,
          unitPrice: 95000,
          totalPrice: 475000,
          unit: "units"
        }
      ],
      totalAmount: 475000,
      currency: "INR",
      priority: "high",
      status: "approved",
      requiredDate: "2025-06-15T00:00:00.000Z",
      preferredVendorId: "vendor_acme",
      budgetAvailable: true,
      approvedBy: "user_manager",
      approvedAt: createdAt,
      notes: "Approved for Q3 budget",
      metadata: {}
    },
    {
      id: "pr_office_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      requestNumber: "PR-2025-002",
      title: "Office Supplies Reorder",
      description: "Monthly office supplies",
      requestedBy: "user_admin",
      department: "Administration",
      category: "Office Supplies",
      items: [
        {
          id: "item_pr002_1",
          description: "A4 Paper (Box)",
          quantity: 20,
          unitPrice: 350,
          totalPrice: 7000,
          unit: "boxes"
        },
        {
          id: "item_pr002_2",
          description: "Pens (Pack)",
          quantity: 50,
          unitPrice: 120,
          totalPrice: 6000,
          unit: "packs"
        }
      ],
      totalAmount: 13000,
      currency: "INR",
      priority: "low",
      status: "submitted",
      requiredDate: "2025-06-01T00:00:00.000Z",
      budgetAvailable: true,
      notes: "Monthly reorder",
      metadata: {}
    },
    {
      id: "pr_cloud_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      requestNumber: "PR-2025-003",
      title: "Cloud Infrastructure Upgrade",
      description: "Additional cloud credits for AI workloads",
      requestedBy: "user_infra",
      department: "Infrastructure",
      project: "AI Platform",
      category: "Cloud",
      items: [
        {
          id: "item_pr003_1",
          description: "Cloud Credits - AWS",
          quantity: 1,
          unitPrice: 250000,
          totalPrice: 250000,
          unit: "credits"
        }
      ],
      totalAmount: 250000,
      currency: "INR",
      priority: "urgent",
      status: "under_review",
      requiredDate: "2025-05-30T00:00:00.000Z",
      budgetAvailable: true,
      notes: "Urgent - AI platform deployment",
      metadata: {}
    }
  );

  state.purchaseOrders.push(
    {
      id: "po_laptop_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      poNumber: "PO-2025-001",
      vendorId: "vendor_acme",
      vendorName: "ACME Supplies",
      purchaseRequestId: "pr_laptop_001",
      title: "PO for Laptop Purchase",
      items: [
        {
          id: "item_po001_1",
          description: "Laptop - Dell XPS 15",
          quantity: 5,
          unitPrice: 92000,
          totalPrice: 460000,
          tax: 82800,
          deliveredQuantity: 0
        }
      ],
      subtotal: 460000,
      tax: 82800,
      totalAmount: 542800,
      currency: "INR",
      status: "sent",
      deliveryDate: "2025-06-10T00:00:00.000Z",
      deliveryAddress: "APPNEURAL HQ, Mumbai",
      paymentTerms: "Net 30",
      approvedBy: "user_manager",
      approvedAt: createdAt,
      sentAt: createdAt,
      metadata: {}
    }
  );

  state.receipts.push(
    {
      id: "receipt_po001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      receiptNumber: "GR-2025-001",
      purchaseOrderId: "po_laptop_001",
      poNumber: "PO-2025-001",
      vendorId: "vendor_acme",
      vendorName: "ACME Supplies",
      items: [],
      totalOrdered: 5,
      totalReceived: 0,
      totalAccepted: 0,
      totalRejected: 0,
      status: "pending",
      receivedDate: createdAt,
      receivedBy: "user_warehouse"
    }
  );

  state.rfqs.push(
    {
      id: "rfq_office_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      rfqNumber: "RFQ-2025-001",
      title: "Office Supplies Annual Contract",
      description: "Annual supply contract for office supplies",
      purchaseRequestId: "pr_office_002",
      items: [
        {
          id: "item_rfq001_1",
          description: "A4 Paper (Box)",
          quantity: 240,
          unitPrice: 0,
          totalPrice: 0
        },
        {
          id: "item_rfq001_2",
          description: "Pens (Pack)",
          quantity: 600,
          unitPrice: 0,
          totalPrice: 0
        }
      ],
      currency: "INR",
      status: "sent",
      vendorIds: ["vendor_officepro", "vendor_techparts"],
      deadline: "2025-06-05T00:00:00.000Z",
      deliveryLocation: "APPNEURAL HQ, Mumbai",
      notes: "Looking for annual contract"
    }
  );

  state.quotes.push(
    {
      id: "quote_office_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      rfqId: "rfq_office_001",
      vendorId: "vendor_officepro",
      vendorName: "Office Pro",
      quoteNumber: "Q-2025-001",
      items: [
        {
          id: "item_q001_1",
          description: "A4 Paper (Box)",
          quantity: 240,
          unitPrice: 320,
          totalPrice: 76800,
          tax: 13824
        },
        {
          id: "item_q001_2",
          description: "Pens (Pack)",
          quantity: 600,
          unitPrice: 100,
          totalPrice: 60000,
          tax: 10800
        }
      ],
      subtotal: 136800,
      tax: 24624,
      totalAmount: 161424,
      currency: "INR",
      validUntil: "2025-07-01T00:00:00.000Z",
      deliveryDate: "2025-06-15T00:00:00.000Z",
      paymentTerms: "Net 30",
      warranty: "Standard manufacturer warranty",
      status: "submitted"
    }
  );

  state.budgetAllocations.push(
    {
      id: "budget_eng_2025",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Engineering Department Budget 2025",
      department: "Engineering",
      project: "Q3 Expansion",
      category: "Hardware",
      allocatedAmount: 1000000,
      spentAmount: 542800,
      availableAmount: 457200,
      currency: "INR",
      fiscalYear: "2025",
      period: "yearly",
      status: "active"
    },
    {
      id: "budget_admin_2025",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Administration Budget 2025",
      department: "Administration",
      category: "Office Supplies",
      allocatedAmount: 200000,
      spentAmount: 0,
      availableAmount: 200000,
      currency: "INR",
      fiscalYear: "2025",
      period: "yearly",
      status: "active"
    },
    {
      id: "budget_infra_2025",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Infrastructure Budget 2025",
      department: "Infrastructure",
      project: "AI Platform",
      category: "Cloud",
      allocatedAmount: 500000,
      spentAmount: 0,
      availableAmount: 500000,
      currency: "INR",
      fiscalYear: "2025",
      period: "yearly",
      status: "active"
    }
  );

  state.events.push({
    id: "evt_seed_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "procurementos.seeded",
    source: "ProcurementOS",
    entityType: "system",
    data: { message: "ProcurementOS demo data seeded" }
  });

  return state;
}
