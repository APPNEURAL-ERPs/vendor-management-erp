export function docs() {
  return {
    name: "InventoryOS",
    version: "1.0.0",
    description: "Operating layer for inventory management, stock levels, warehouses, transfers, and inventory lifecycle.",
    auth: {
      headers: {
        "x-role": "owner | admin | inventory_admin | inventory_manager | warehouse_manager | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      item: "A product or material tracked in inventory with SKU, pricing, and stock levels.",
      warehouse: "A physical storage location for inventory items.",
      stockLevel: "Current quantity of an item at a specific warehouse.",
      transfer: "Movement of inventory from one warehouse to another.",
      adjustment: "Manual correction of stock quantities due to damage, loss, count variance, etc."
    },
    examples: {
      createItem: {
        method: "POST",
        path: "/inventory/items",
        headers: { "x-role": "inventory_manager" },
        body: {
          sku: "LAP-DELL-002",
          name: "Dell Laptop XPS 13",
          category: "Electronics",
          unit: "piece",
          costPrice: 75000,
          sellingPrice: 100000,
          minimumStock: 5,
          reorderLevel: 10
        }
      },
      receiveStock: {
        method: "POST",
        path: "/inventory/stock/in",
        headers: { "x-role": "inventory_manager" },
        body: {
          itemId: "item_laptop_001",
          warehouseId: "wh_udaipur_main",
          quantity: 50,
          unitCost: 85000,
          sourceType: "purchase",
          referenceNumber: "PO-2024-100"
        }
      },
      issueStock: {
        method: "POST",
        path: "/inventory/stock/out",
        headers: { "x-role": "inventory_manager" },
        body: {
          itemId: "item_kit_workshop_001",
          warehouseId: "wh_training_center",
          quantity: 80,
          destinationType: "issue",
          issuedTo: "Batch AI-2024-06",
          notes: "Workshop kits for upcoming batch"
        }
      },
      createTransfer: {
        method: "POST",
        path: "/inventory/transfers",
        headers: { "x-role": "inventory_manager" },
        body: {
          fromWarehouseId: "wh_udaipur_main",
          toWarehouseId: "wh_jaipur_office",
          items: [{ itemId: "item_kit_workshop_001", quantity: 50 }],
          notes: "Transfer kits to Jaipur for workshop"
        }
      },
      createAdjustment: {
        method: "POST",
        path: "/inventory/adjustments",
        headers: { "x-role": "inventory_manager" },
        body: {
          itemId: "item_laptop_001",
          warehouseId: "wh_udaipur_main",
          adjustmentType: "damage",
          quantity: -2,
          reason: "Physical damage found during inspection"
        }
      }
    },
    coreEntities: [
      "InventoryItem",
      "Warehouse",
      "StockLevel",
      "StockInward",
      "StockOutward",
      "Transfer",
      "StockAdjustment",
      "StockReservation",
      "ReorderRule",
      "StockCount"
    ],
    keyMetrics: [
      "Total items and active items",
      "Low stock and out-of-stock items",
      "Available, reserved, and damaged stock",
      "Total inventory value",
      "Pending and in-transit transfers",
      "Stock movements (inward/outward)"
    ]
  };
}
