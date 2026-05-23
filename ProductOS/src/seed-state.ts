import { ProductState } from "./core/domain";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): ProductState {
  const now = nowIso();
  return {
    products: [
      { id: "prod_appneurox", tenantId, createdAt: now, updatedAt: now, productCode: "APPNEUROX", name: "AppneuroX", description: "AI operating platform for agents, RAG, automation, and OS orchestration.", type: "software", lifecycleStage: "development", status: "active", ownerId: "pm_maya", market: "AI Platforms", tags: ["ai", "agents", "enterprise"], targetLaunchDate: "2026-08-15", createdBy: "seed", customFields: { pricingTier: "growth" } },
      { id: "prod_brandlyup", tenantId, createdAt: now, updatedAt: now, productCode: "BRANDLYUP", name: "BrandlyUp", description: "Brand asset and campaign management platform.", type: "software", lifecycleStage: "launched", status: "active", ownerId: "pm_rahul", market: "Marketing SaaS", tags: ["brand", "content"], targetLaunchDate: "2026-04-01", createdBy: "seed", customFields: {} },
      { id: "prod_devicekit", tenantId, createdAt: now, updatedAt: now, productCode: "DEVICEKIT", name: "DeviceKit", description: "Reference IoT kit with hardware BOM for manufacturing examples.", type: "hardware", lifecycleStage: "planning", status: "active", ownerId: "pm_neha", market: "Manufacturing", tags: ["iot", "hardware"], targetLaunchDate: "2026-10-01", createdBy: "seed", customFields: {} }
    ],
    versions: [
      { id: "ver_appneurox_100", tenantId, createdAt: now, updatedAt: now, productId: "prod_appneurox", version: "1.0.0", name: "Foundation Release", status: "released", releaseDate: "2026-05-01", notes: "Base AI workspace and organization setup.", createdBy: "seed" },
      { id: "ver_appneurox_110", tenantId, createdAt: now, updatedAt: now, productId: "prod_appneurox", version: "1.1.0", name: "Agent Workspace", status: "in_development", releaseDate: "2026-07-15", notes: "Agent template marketplace and RAG improvements.", createdBy: "seed" },
      { id: "ver_devicekit_alpha", tenantId, createdAt: now, updatedAt: now, productId: "prod_devicekit", version: "0.1.0", name: "Alpha Prototype", status: "planned", releaseDate: "2026-09-01", notes: "Hardware prototype alpha.", createdBy: "seed" }
    ],
    roadmapItems: [
      { id: "road_q3_ai_agents", tenantId, createdAt: now, updatedAt: now, roadmapNumber: "ROAD-0001", productId: "prod_appneurox", title: "Q3 AI Agent Workspace", description: "Launch complete workspace for AI agents and reusable templates.", quarter: "2026-Q3", ownerId: "pm_maya", priority: "critical", status: "in_progress", startDate: "2026-06-01", dueDate: "2026-07-15", linkedFeatureIds: ["feat_ai_workspace", "feat_agent_templates"], createdBy: "seed" },
      { id: "road_q3_product_analytics", tenantId, createdAt: now, updatedAt: now, roadmapNumber: "ROAD-0002", productId: "prod_appneurox", title: "Product Usage Analytics", description: "Track product usage, value, and account-level adoption.", quarter: "2026-Q3", ownerId: "pm_maya", priority: "high", status: "planned", startDate: "2026-07-01", dueDate: "2026-08-01", linkedFeatureIds: ["feat_usage_dashboard"], createdBy: "seed" }
    ],
    requirements: [
      { id: "req_ai_workspace", tenantId, createdAt: now, updatedAt: now, requirementNumber: "REQ-0001", productId: "prod_appneurox", title: "Unified AI agent workspace", description: "Users need one screen to create, test, and publish AI agents.", source: "customer", priority: "critical", status: "approved", requestedBy: "acct_northstar", approvedBy: "pm_maya", approvedAt: now, createdBy: "seed" },
      { id: "req_template_gallery", tenantId, createdAt: now, updatedAt: now, requirementNumber: "REQ-0002", productId: "prod_appneurox", title: "Agent template gallery", description: "Teams should start from reusable agent templates.", source: "internal", priority: "high", status: "approved", approvedBy: "pm_maya", approvedAt: now, createdBy: "seed" },
      { id: "req_hardware_costing", tenantId, createdAt: now, updatedAt: now, requirementNumber: "REQ-0003", productId: "prod_devicekit", title: "Hardware costing BOM", description: "Manufacturing users need a clear bill of materials cost rollup.", source: "market", priority: "high", status: "draft", createdBy: "seed" }
    ],
    features: [
      { id: "feat_ai_workspace", tenantId, createdAt: now, updatedAt: now, featureNumber: "FEAT-0001", productId: "prod_appneurox", requirementId: "req_ai_workspace", roadmapItemId: "road_q3_ai_agents", title: "AI Agent Workspace", description: "Create, test, and publish AI agents from a unified workspace.", priority: "critical", status: "in_development", ownerId: "eng_asha", effortPoints: 13, valueScore: 95, riskScore: 25, tags: ["ai", "agents"], createdBy: "seed" },
      { id: "feat_agent_templates", tenantId, createdAt: now, updatedAt: now, featureNumber: "FEAT-0002", productId: "prod_appneurox", requirementId: "req_template_gallery", roadmapItemId: "road_q3_ai_agents", title: "Agent Template Gallery", description: "Reusable templates for support, sales, analytics, and HR agents.", priority: "high", status: "planned", ownerId: "eng_rahul", effortPoints: 8, valueScore: 82, riskScore: 15, tags: ["templates", "marketplace"], createdBy: "seed" },
      { id: "feat_usage_dashboard", tenantId, createdAt: now, updatedAt: now, featureNumber: "FEAT-0003", productId: "prod_appneurox", title: "Usage Dashboard", description: "Product usage analytics for adoption and retention.", priority: "high", status: "backlog", ownerId: "eng_neha", effortPoints: 5, valueScore: 78, riskScore: 10, tags: ["analytics"], createdBy: "seed" },
      { id: "feat_brand_calendar", tenantId, createdAt: now, updatedAt: now, featureNumber: "FEAT-0004", productId: "prod_brandlyup", title: "Campaign Calendar", description: "Calendar for scheduling brand campaigns and content.", priority: "medium", status: "released", ownerId: "eng_isha", effortPoints: 5, valueScore: 66, riskScore: 8, tags: ["calendar"], createdBy: "seed", releasedAt: now }
    ],
    backlogItems: [
      { id: "backlog_agent_builder_ui", tenantId, createdAt: now, updatedAt: now, backlogNumber: "BACK-0001", productId: "prod_appneurox", featureId: "feat_ai_workspace", title: "Build agent editor UI", description: "Agent builder panels and prompt testing area.", type: "story", priority: "critical", status: "in_progress", assigneeId: "eng_asha", sprint: "AIOS-Sprint-12", effortPoints: 8, createdBy: "seed" },
      { id: "backlog_template_filters", tenantId, createdAt: now, updatedAt: now, backlogNumber: "BACK-0002", productId: "prod_appneurox", featureId: "feat_agent_templates", title: "Template category filters", description: "Allow templates to be filtered by industry and OS.", type: "story", priority: "medium", status: "open", assigneeId: "eng_rahul", sprint: "AIOS-Sprint-13", effortPoints: 3, createdBy: "seed" },
      { id: "backlog_usage_chart", tenantId, createdAt: now, updatedAt: now, backlogNumber: "BACK-0003", productId: "prod_appneurox", featureId: "feat_usage_dashboard", title: "Daily active workspace chart", description: "Chart for active workspaces by day.", type: "task", priority: "high", status: "open", assigneeId: "eng_neha", sprint: "Analytics-Sprint-2", effortPoints: 5, createdBy: "seed" }
    ],
    releases: [
      { id: "rel_appneurox_100", tenantId, createdAt: now, updatedAt: now, releaseNumber: "REL-0001", productId: "prod_appneurox", versionId: "ver_appneurox_100", name: "AppneuroX Foundation", status: "released", plannedDate: "2026-05-01", releasedAt: "2026-05-01T09:00:00.000Z", featureIds: [], notes: "Initial launch.", releaseManagerId: "rel_maya", approvedBy: "pm_maya", approvedAt: "2026-04-28T09:00:00.000Z", createdBy: "seed" },
      { id: "rel_appneurox_110", tenantId, createdAt: now, updatedAt: now, releaseNumber: "REL-0002", productId: "prod_appneurox", versionId: "ver_appneurox_110", name: "Agent Workspace Release", status: "scheduled", plannedDate: "2026-07-15", featureIds: ["feat_ai_workspace", "feat_agent_templates"], notes: "Agent workspace release train.", releaseManagerId: "rel_maya", approvedBy: "pm_maya", approvedAt: now, createdBy: "seed" }
    ],
    components: [
      { id: "comp_llm_credit", tenantId, createdAt: now, updatedAt: now, sku: "LLM-CREDIT", name: "LLM Usage Credit", description: "Unit cost proxy for LLM inference allocation.", category: "cloud", unit: "1k tokens", unitCost: 0.08, currency: "INR", supplier: "AI Provider", status: "active", createdBy: "seed" },
      { id: "comp_vector_storage", tenantId, createdAt: now, updatedAt: now, sku: "VECTOR-GB", name: "Vector Storage", description: "Vector DB storage unit.", category: "cloud", unit: "GB", unitCost: 18, currency: "INR", supplier: "Cloud Provider", status: "active", createdBy: "seed" },
      { id: "comp_device_board", tenantId, createdAt: now, updatedAt: now, sku: "BOARD-IOT-01", name: "IoT Controller Board", description: "Controller board for DeviceKit.", category: "hardware", unit: "piece", unitCost: 1250, currency: "INR", supplier: "PCB Supplier", status: "active", createdBy: "seed" },
      { id: "comp_sensor_pack", tenantId, createdAt: now, updatedAt: now, sku: "SENSOR-PACK", name: "Sensor Pack", description: "Multi-sensor pack for DeviceKit.", category: "hardware", unit: "piece", unitCost: 640, currency: "INR", supplier: "Sensor Supplier", status: "active", createdBy: "seed" }
    ],
    boms: [
      { id: "bom_appneurox_ai", tenantId, createdAt: now, updatedAt: now, bomNumber: "BOM-0001", productId: "prod_appneurox", versionId: "ver_appneurox_110", name: "AppneuroX AI Runtime BOM", status: "active", currency: "INR", lines: [
        { componentId: "comp_llm_credit", sku: "LLM-CREDIT", name: "LLM Usage Credit", quantity: 100000, unit: "1k tokens", unitCost: 0.08, totalCost: 8000 },
        { componentId: "comp_vector_storage", sku: "VECTOR-GB", name: "Vector Storage", quantity: 25, unit: "GB", unitCost: 18, totalCost: 450 }
      ], totalCost: 8450, approvedBy: "pm_maya", approvedAt: now, createdBy: "seed" },
      { id: "bom_devicekit_alpha", tenantId, createdAt: now, updatedAt: now, bomNumber: "BOM-0002", productId: "prod_devicekit", versionId: "ver_devicekit_alpha", name: "DeviceKit Alpha BOM", status: "draft", currency: "INR", lines: [
        { componentId: "comp_device_board", sku: "BOARD-IOT-01", name: "IoT Controller Board", quantity: 1, unit: "piece", unitCost: 1250, totalCost: 1250 },
        { componentId: "comp_sensor_pack", sku: "SENSOR-PACK", name: "Sensor Pack", quantity: 2, unit: "piece", unitCost: 640, totalCost: 1280 }
      ], totalCost: 2530, createdBy: "seed" }
    ],
    changeRequests: [
      { id: "chg_template_scope", tenantId, createdAt: now, updatedAt: now, changeNumber: "CHG-0001", productId: "prod_appneurox", targetType: "feature", targetId: "feat_agent_templates", title: "Add industry-specific templates", reason: "Sales feedback from healthcare and retail prospects.", impact: "medium", status: "approved", requestedBy: "sales_maya", approvedBy: "pm_maya", approvedAt: now }
    ],
    events: [
      { id: "evt_seed_productos", tenantId, createdAt: now, updatedAt: now, event: "productos.seeded", source: "ProductOS", actorId: "seed", data: { products: 3, features: 4, releases: 2 } }
    ],
    auditLogs: []
  };
}
