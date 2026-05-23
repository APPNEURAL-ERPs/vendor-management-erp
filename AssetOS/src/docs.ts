export function docs() {
  return {
    name: "AssetOS",
    version: "1.0.0",
    description: "Asset lifecycle, fixed assets, IT assets, equipment, assignment, handover, maintenance, depreciation, warranty, and asset governance.",
    auth: {
      headers: {
        "x-role": "owner | admin | asset_admin | asset_manager | asset_operator | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    roles: {
      owner: "Full access to all operations",
      admin: "Full access to all operations",
      asset_admin: "Manage assets, categories, assignments, maintenance, depreciation, warranties, audits, and reports",
      asset_manager: "Manage assets, categories, assignments, maintenance, warranties, audits, and reports",
      asset_operator: "View assets, categories, assignments, maintenance, and run reports",
      viewer: "Read-only access to assets and categories"
    },
    entities: {
      Asset: "Physical or digital asset with location, condition, assignment status, and financial tracking",
      AssetCategory: "Hierarchical classification for organizing assets with optional parent relationships",
      AssetAssignment: "Temporary or permanent assignment of assets to users with handover/return tracking",
      MaintenanceRecord: "Preventive, corrective, inspection, upgrade, or calibration maintenance activities",
      AssetWarranty: "Manufacturer, extended, service, or limited warranty coverage tracking",
      AssetDepreciation: "Straight-line, declining-balance, sum-of-years, or units-of-production depreciation methods",
      AssetAudit: "Scheduled audits with findings, recommendations, and pass/fail tracking"
    },
    coreConcepts: {
      asset: "A trackable item with serial number, barcode, location, and lifecycle status",
      category: "Organizational hierarchy for grouping related assets",
      assignment: "Asset handover to users with expected return dates and condition tracking",
      maintenance: "Scheduled or corrective actions to keep assets operational",
      depreciation: "Financial tracking of asset value reduction over time",
      warranty: "Protection coverage tracking with expiration alerts",
      audit: "Physical verification of asset existence and condition"
    },
    examples: {
      createAsset: {
        method: "POST",
        path: "/assetos/assets",
        headers: { "x-role": "asset_admin" },
        body: {
          key: "laptop-dell-xps-15",
          name: "Dell XPS 15 Laptop",
          categoryId: "cat_it_equipment",
          serialNumber: "SN-12345",
          condition: "excellent",
          purchaseDate: "2024-01-15",
          purchasePrice: 1899.99,
          supplier: "Dell Inc",
          manufacturer: "Dell",
          model: "XPS 15 9530",
          location: { building: "HQ", floor: "3", room: "312" },
          tags: ["laptop", "windows", "developer"]
        }
      },
      assignAsset: {
        method: "POST",
        path: "/assetos/assignments",
        headers: { "x-role": "asset_admin" },
        body: {
          assetId: "asset_xxx",
          assignedTo: "user_123",
          assignedBy: "admin_456",
          expectedReturnDate: "2024-12-31",
          handoverCondition: "excellent",
          notes: "Assigned for software development work"
        }
      },
      scheduleMaintenance: {
        method: "POST",
        path: "/assetos/maintenance",
        headers: { "x-role": "asset_admin" },
        body: {
          assetId: "asset_xxx",
          type: "preventive",
          priority: "medium",
          title: "Quarterly laptop maintenance",
          scheduledDate: "2024-04-01",
          technician: "John Smith",
          nextMaintenanceDate: "2024-07-01"
        }
      },
      createDepreciation: {
        method: "POST",
        path: "/assetos/depreciations",
        headers: { "x-role": "asset_admin" },
        body: {
          assetId: "asset_xxx",
          method: "straight_line",
          purchasePrice: 5000,
          salvageValue: 500,
          usefulLifeMonths: 60,
          depreciationStartDate: "2024-01-15"
        }
      },
      scheduleAudit: {
        method: "POST",
        path: "/assetos/audits",
        headers: { "x-role": "asset_admin" },
        body: {
          title: "Q1 2024 IT Equipment Audit",
          description: "Quarterly verification of all IT equipment",
          auditorId: "auditor_001",
          scheduledDate: "2024-03-15"
        }
      }
    }
  };
}
