export function docs() {
  return {
    name: "ProcurementOS",
    version: "1.0.0",
    description: "Purchase requests, vendor management, approvals, purchase orders, goods receipts, and procurement lifecycle management",
    auth: {
      headers: {
        "x-role": "owner | admin | procurement_manager | procurement_analyst | approver | requester | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      vendor: "A supplier providing goods or services for procurement",
      purchaseRequest: "Internal request for purchasing items or services",
      purchaseOrder: "Formal order issued to a vendor for goods or services",
      approval: "Workflow for authorizing purchases based on amount and policy",
      receipt: "Goods or services received from a vendor",
      rfq: "Request for Quotation sent to vendors",
      quote: "Vendor's price quotation in response to an RFQ"
    },
    examples: {
      createPurchaseRequest: {
        method: "POST",
        path: "/procurementos/requests",
        headers: { "x-role": "requester" },
        body: {
          title: "Laptop Purchase",
          description: "5 laptops for engineering team",
          department: "Engineering",
          items: [{ description: "Laptop", quantity: 5, unitPrice: 50000, totalPrice: 250000 }]
        }
      },
      approvePurchaseRequest: {
        method: "POST",
        path: "/procurementos/requests/:id/approve",
        headers: { "x-role": "approver" },
        body: { comments: "Approved for Q3 budget" }
      },
      createPurchaseOrder: {
        method: "POST",
        path: "/procurementos/purchase-orders",
        headers: { "x-role": "procurement_manager" },
        body: {
          vendorId: "vendor_xyz",
          title: "PO for Laptop Purchase",
          items: [{ description: "Laptop", quantity: 5, unitPrice: 48000, totalPrice: 240000 }]
        }
      },
      createReceipt: {
        method: "POST",
        path: "/procurementos/receipts",
        headers: { "x-role": "procurement_manager" },
        body: {
          purchaseOrderId: "po_xyz",
          items: [{ purchaseOrderItemId: "item_xyz", description: "Laptop", orderedQuantity: 5, receivedQuantity: 5, acceptedQuantity: 5 }]
        }
      }
    }
  };
}
