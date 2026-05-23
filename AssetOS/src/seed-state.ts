import { AssetState } from "./domain";
import { newId, nowIso, plusDays } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): AssetState {
  const now = nowIso();
  const state: AssetState = {
    assets: [],
    categories: [],
    assignments: [],
    maintenanceRecords: [],
    warranties: [],
    audits: [],
    depreciations: [],
    events: [],
    runs: [],
    auditLogs: []
  };

  const categoryItEquipment = {
    id: "cat_it_equipment",
    tenantId,
    createdAt: now,
    updatedAt: now,
    key: "it_equipment",
    name: "IT Equipment",
    description: "Information technology equipment including computers, laptops, monitors, and peripherals",
    parentId: undefined,
    status: "active" as const,
    tags: ["it", "technology", "hardware"],
    metadata: {}
  };

  const categoryFurniture = {
    id: "cat_furniture",
    tenantId,
    createdAt: now,
    updatedAt: now,
    key: "office_furniture",
    name: "Office Furniture",
    description: "Desks, chairs, cabinets, and other office furniture",
    parentId: undefined,
    status: "active" as const,
    tags: ["office", "furniture", "workspace"],
    metadata: {}
  };

  const categoryVehicles = {
    id: "cat_vehicles",
    tenantId,
    createdAt: now,
    updatedAt: now,
    key: "vehicles",
    name: "Company Vehicles",
    description: "Company cars, trucks, and other vehicles",
    parentId: undefined,
    status: "active" as const,
    tags: ["transport", "vehicles", "fleet"],
    metadata: {}
  };

  const categoryElectronics = {
    id: "cat_electronics",
    tenantId,
    createdAt: now,
    updatedAt: now,
    key: "electronics",
    name: "Electronics",
    description: "Phones, tablets, projectors, and other electronic devices",
    parentId: "cat_it_equipment",
    status: "active" as const,
    tags: ["electronics", "devices"],
    metadata: {}
  };

  state.categories.push(categoryItEquipment, categoryFurniture, categoryVehicles, categoryElectronics);

  const laptopDell: any = {
    id: newId("asset"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    key: "laptop-dell-xps-15",
    name: "Dell XPS 15 Laptop",
    description: "Primary development laptop for software engineering team",
    categoryId: categoryItEquipment.id,
    serialNumber: "SN-DELL-XPS-001",
    barcode: "BC-123456789",
    status: "active",
    condition: "excellent",
    purchaseDate: "2024-01-15",
    purchasePrice: 1899.99,
    supplier: "Dell Inc",
    manufacturer: "Dell",
    model: "XPS 15 9530",
    color: "Silver",
    weight: "1.8 kg",
    dimensions: "344.72 x 230.14 x 18 mm",
    location: { building: "HQ", floor: "3", room: "312", address: "123 Main Street" },
    parentAssetId: undefined,
    childAssetIds: [],
    tags: ["laptop", "windows", "developer", "high-priority"],
    photos: [],
    documents: [],
    customFields: { ram: "32GB", storage: "1TB SSD", processor: "Intel i7-13700H" },
    metadata: { source: "seed", department: "Engineering" }
  };

  const monitorDell: any = {
    id: newId("asset"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    key: "monitor-dell-u2723de",
    name: "Dell UltraSharp U2723DE Monitor",
    description: "27-inch 4K USB-C Hub Monitor",
    categoryId: categoryItEquipment.id,
    serialNumber: "SN-DELL-MON-001",
    status: "active",
    condition: "good",
    purchaseDate: "2024-01-20",
    purchasePrice: 799.99,
    supplier: "Dell Inc",
    manufacturer: "Dell",
    model: "U2723DE",
    location: { building: "HQ", floor: "3", room: "312" },
    parentAssetId: laptopDell.id,
    childAssetIds: [],
    tags: ["monitor", "display", "4k"],
    customFields: { resolution: "3840x2160", panelType: "IPS Black" },
    metadata: { source: "seed" }
  };
  laptopDell.childAssetIds.push(monitorDell.id);

  const keyboardLogitech: any = {
    id: newId("asset"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    key: "keyboard-logitech-mx-keys",
    name: "Logitech MX Keys Keyboard",
    description: "Advanced wireless illuminated keyboard",
    categoryId: categoryElectronics.id,
    serialNumber: "SN-LOGI-KEY-001",
    status: "active",
    condition: "excellent",
    purchaseDate: "2024-02-01",
    purchasePrice: 119.99,
    supplier: "Logitech",
    manufacturer: "Logitech",
    model: "MX Keys",
    location: { building: "HQ", floor: "3", room: "312" },
    parentAssetId: laptopDell.id,
    childAssetIds: [],
    tags: ["keyboard", "wireless", "peripheral"],
    metadata: { source: "seed" }
  };
  laptopDell.childAssetIds.push(keyboardLogitech.id);

  const deskHermanMiller: any = {
    id: newId("asset"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    key: "desk-herman-miller-aeron",
    name: "Herman Miller Aeron Chair",
    description: "Ergonomic office chair for executive use",
    categoryId: categoryFurniture.id,
    serialNumber: "SN-HM-AERON-001",
    status: "active",
    condition: "excellent",
    purchaseDate: "2023-06-15",
    purchasePrice: 1395.00,
    supplier: "Herman Miller",
    manufacturer: "Herman Miller",
    model: "Aeron Size B",
    location: { building: "HQ", floor: "3", room: "312" },
    parentAssetId: undefined,
    childAssetIds: [],
    tags: ["chair", "ergonomic", "executive"],
    metadata: { source: "seed" }
  };

  const companyCarToyota: any = {
    id: newId("asset"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    key: "car-toyota-camry-2024",
    name: "Toyota Camry SE 2024",
    description: "Company fleet vehicle for sales team",
    categoryId: categoryVehicles.id,
    serialNumber: "VIN-1HGBH41JXMN109186",
    status: "active",
    condition: "excellent",
    purchaseDate: "2024-03-01",
    purchasePrice: 28999.00,
    supplier: "Toyota Dealership",
    manufacturer: "Toyota",
    model: "Camry SE",
    location: { address: "Company Parking Lot" },
    parentAssetId: undefined,
    childAssetIds: [],
    tags: ["vehicle", "fleet", "sales"],
    customFields: { color: "Midnight Black", mileage: 0, licensePlate: "ABC-1234" },
    metadata: { source: "seed", department: "Sales" }
  };

  const phoneiPhone: any = {
    id: newId("asset"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    key: "phone-iphone-15-pro",
    name: "iPhone 15 Pro",
    description: "Company mobile device for management",
    categoryId: categoryElectronics.id,
    serialNumber: "SN-APPLE-IPH-001",
    status: "active",
    condition: "good",
    purchaseDate: "2024-04-15",
    purchasePrice: 1199.00,
    supplier: "Apple Store",
    manufacturer: "Apple",
    model: "iPhone 15 Pro 256GB",
    location: { building: "HQ", floor: "2", room: "Executive Office" },
    parentAssetId: undefined,
    childAssetIds: [],
    tags: ["phone", "mobile", "executive"],
    metadata: { source: "seed" }
  };

  state.assets.push(laptopDell, monitorDell, keyboardLogitech, deskHermanMiller, companyCarToyota, phoneiPhone);

  const assignment1: any = {
    id: newId("assign"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    assetId: laptopDell.id,
    assignedTo: "user_engineer_001",
    assignedBy: "admin_001",
    status: "active",
    assignedDate: now,
    expectedReturnDate: plusDays(365),
    location: { building: "HQ", floor: "3", room: "312" },
    notes: "Primary development workstation",
    handoverCondition: "excellent",
    metadata: {}
  };
  state.assignments.push(assignment1);

  laptopDell.assignedTo = assignment1.assignedTo;
  laptopDell.assignedDate = assignment1.assignedDate;

  const assignment2: any = {
    id: newId("assign"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    assetId: companyCarToyota.id,
    assignedTo: "user_sales_001",
    assignedBy: "admin_001",
    status: "active",
    assignedDate: now,
    expectedReturnDate: plusDays(30),
    notes: "Assigned for client meetings and sales visits",
    handoverCondition: "excellent",
    metadata: {}
  };
  state.assignments.push(assignment2);

  companyCarToyota.assignedTo = assignment2.assignedTo;
  companyCarToyota.assignedDate = assignment2.assignedDate;

  const warranty1: any = {
    id: newId("warranty"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    assetId: laptopDell.id,
    provider: "Dell Inc",
    type: "manufacturer",
    startDate: "2024-01-15",
    endDate: "2027-01-15",
    coverageDetails: "Complete coverage for manufacturing defects and hardware failures",
    claimContact: "dell-support@company.com",
    claimPhone: "1-800-456-3355",
    status: "active",
    cost: 0,
    metadata: {}
  };
  state.warranties.push(warranty1);
  laptopDell.warrantyId = warranty1.id;

  const warranty2: any = {
    id: newId("warranty"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    assetId: companyCarToyota.id,
    provider: "Toyota Motor Corporation",
    type: "manufacturer",
    startDate: "2024-03-01",
    endDate: "2029-03-01",
    coverageDetails: "5-year/60,000 mile comprehensive warranty",
    status: "active",
    metadata: {}
  };
  state.warranties.push(warranty2);
  companyCarToyota.warrantyId = warranty2.id;

  const depreciation1: any = {
    id: newId("depr"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    assetId: laptopDell.id,
    method: "straight_line",
    purchasePrice: 1899.99,
    salvageValue: 200,
    usefulLifeMonths: 48,
    depreciationStartDate: "2024-01-15",
    currentValue: 1899.99,
    accumulatedDepreciation: 0,
    monthlyDepreciation: 35.42,
    status: "active",
    metadata: {}
  };
  state.depreciations.push(depreciation1);
  laptopDell.depreciationId = depreciation1.id;

  const depreciation2: any = {
    id: newId("depr"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    assetId: companyCarToyota.id,
    method: "straight_line",
    purchasePrice: 28999.00,
    salvageValue: 5000,
    usefulLifeMonths: 60,
    depreciationStartDate: "2024-03-01",
    currentValue: 28999.00,
    accumulatedDepreciation: 0,
    monthlyDepreciation: 399.98,
    status: "active",
    metadata: {}
  };
  state.depreciations.push(depreciation2);
  companyCarToyota.depreciationId = depreciation2.id;

  const maintenance1: any = {
    id: newId("maint"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    assetId: laptopDell.id,
    type: "preventive",
    status: "scheduled",
    priority: "medium",
    title: "Quarterly laptop maintenance - Q2 2024",
    description: "Standard preventive maintenance including software updates, disk cleanup, and hardware inspection",
    scheduledDate: plusDays(30),
    technician: "IT Support Team",
    notes: "Include battery health check",
    nextMaintenanceDate: plusDays(120),
    metadata: {}
  };
  state.maintenanceRecords.push(maintenance1);

  const maintenance2: any = {
    id: newId("maint"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    assetId: companyCarToyota.id,
    type: "preventive",
    status: "scheduled",
    priority: "high",
    title: "Annual vehicle inspection",
    description: "Required annual safety and emissions inspection",
    scheduledDate: plusDays(60),
    technician: "AutoService Pro",
    cost: 150.00,
    notes: "Schedule with dealership",
    nextMaintenanceDate: plusDays(425),
    metadata: {}
  };
  state.maintenanceRecords.push(maintenance2);

  const maintenance3: any = {
    id: newId("maint"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    assetId: deskHermanMiller.id,
    type: "inspection",
    status: "completed",
    priority: "low",
    title: "Annual chair inspection",
    description: "Ergonomic chair condition check",
    scheduledDate: minusDays(30),
    completedDate: minusDays(28),
    technician: "Facilities Team",
    cost: 0,
    notes: "Chair in excellent condition, no adjustments needed",
    metadata: {}
  };
  state.maintenanceRecords.push(maintenance3);

  const audit1: any = {
    id: newId("audit"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    title: "Q2 2024 IT Equipment Audit",
    description: "Quarterly verification of all IT equipment in HQ building",
    auditorId: "auditor_001",
    scheduledDate: plusDays(15),
    status: "scheduled",
    itemsAudited: 0,
    itemsPassed: 0,
    itemsFailed: 0,
    metadata: {}
  };
  state.audits.push(audit1);

  const audit2: any = {
    id: newId("audit"),
    tenantId,
    createdAt: now,
    updatedAt: now,
    title: "Q1 2024 Vehicle Fleet Audit",
    description: "Quarterly verification of all company vehicles",
    auditorId: "auditor_002",
    scheduledDate: minusDays(15),
    completedDate: minusDays(10),
    status: "completed",
    findings: "All vehicles in acceptable condition. Recommend tire rotation for Toyota Camry before next quarter.",
    recommendations: "Schedule tire rotation for company car within 30 days",
    itemsAudited: 5,
    itemsPassed: 5,
    itemsFailed: 0,
    metadata: {}
  };
  state.audits.push(audit2);

  state.events.push(
    {
      id: newId("event"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      type: "assetos.seeded",
      source: "AssetOS",
      assetId: undefined,
      data: { message: "AssetOS demo data seeded", assets: state.assets.length, categories: state.categories.length }
    },
    {
      id: newId("event"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      type: "asset.created",
      source: "AssetOS",
      assetId: laptopDell.id,
      data: { key: laptopDell.key, name: laptopDell.name }
    },
    {
      id: newId("event"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      type: "asset.assigned",
      source: "AssetOS",
      assetId: laptopDell.id,
      data: { assignmentId: assignment1.id, assignedTo: assignment1.assignedTo }
    }
  );

  return state;
}

function minusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}
