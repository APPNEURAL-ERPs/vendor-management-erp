import { AdminState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, plusDays } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): AdminState {
  const state = emptyState();
  const createdAt = nowIso();

  state.settings.push(
    {
      id: "setting_max_users",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "max_users",
      name: "Maximum Users",
      description: "Maximum number of users allowed in the system",
      value: 100,
      valueType: "number",
      category: "general",
      status: "active",
      editable: true,
      visible: true,
      tags: ["users", "quota"],
      metadata: {}
    },
    {
      id: "setting_session_timeout",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "session_timeout",
      name: "Session Timeout",
      description: "Session timeout in minutes",
      value: 30,
      valueType: "number",
      category: "security",
      status: "active",
      editable: true,
      visible: true,
      tags: ["security", "session"],
      metadata: {}
    },
    {
      id: "setting_feature_ai_enabled",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "feature_ai_enabled",
      name: "AI Features Enabled",
      description: "Enable AI features in the platform",
      value: true,
      valueType: "boolean",
      category: "feature_flag",
      status: "active",
      editable: true,
      visible: true,
      tags: ["ai", "feature"],
      metadata: {}
    },
    {
      id: "setting_default_language",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "default_language",
      name: "Default Language",
      description: "Default language for the platform",
      value: "en",
      valueType: "string",
      category: "general",
      status: "active",
      editable: true,
      visible: true,
      tags: ["localization"],
      metadata: {}
    },
    {
      id: "setting_timezone",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "timezone",
      name: "Timezone",
      description: "Platform timezone",
      value: "Asia/Kolkata",
      valueType: "string",
      category: "general",
      status: "active",
      editable: true,
      visible: true,
      tags: ["localization"],
      metadata: {}
    }
  );

  state.orgUnits.push(
    {
      id: "org_company_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Appneural Technologies",
      description: "Main company organization",
      type: "company",
      status: "active",
      metadata: { industry: "technology", founded: "2020" }
    },
    {
      id: "org_branch_mumbai",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Mumbai Office",
      description: "Mumbai branch office",
      type: "branch",
      parentId: "org_company_1",
      status: "active",
      metadata: { location: "Mumbai", employees: 50 }
    },
    {
      id: "org_dept_engineering",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Engineering Department",
      description: "Engineering and product development",
      type: "department",
      parentId: "org_branch_mumbai",
      status: "active",
      metadata: { headcount: 25, budget: 5000000 }
    },
    {
      id: "org_team_backend",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Backend Team",
      description: "Backend development team",
      type: "team",
      parentId: "org_dept_engineering",
      status: "active",
      metadata: { members: 8, techStack: ["Node.js", "Python", "PostgreSQL"] }
    },
    {
      id: "org_team_frontend",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Frontend Team",
      description: "Frontend development team",
      type: "team",
      parentId: "org_dept_engineering",
      status: "active",
      metadata: { members: 6, techStack: ["React", "TypeScript", "Next.js"] }
    }
  );

  state.resources.push(
    {
      id: "resource_storage_main",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Main Storage",
      description: "Primary storage allocation",
      type: "storage",
      status: "available",
      quota: 1000,
      used: 350,
      unit: "GB",
      metadata: { provider: "AWS S3" }
    },
    {
      id: "resource_compute_prod",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Production Compute",
      description: "Production environment compute resources",
      type: "compute",
      status: "allocated",
      orgUnitId: "org_dept_engineering",
      allocatedTo: "user_1",
      quota: 16,
      used: 12,
      unit: "cores",
      metadata: { environment: "production", instanceType: "c5.4xlarge" }
    },
    {
      id: "resource_api_calls",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "API Rate Limit",
      description: "Monthly API call quota",
      type: "api_calls",
      status: "available",
      quota: 1000000,
      used: 250000,
      unit: "calls",
      metadata: { period: "monthly", resetDate: "1st" }
    },
    {
      id: "resource_users_enterprise",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Enterprise User Licenses",
      description: "Enterprise plan user licenses",
      type: "users",
      status: "allocated",
      orgUnitId: "org_company_1",
      quota: 100,
      used: 87,
      unit: "users",
      metadata: { plan: "enterprise", autoRenew: true }
    }
  );

  state.requests.push(
    {
      id: "req_storage_increase",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Storage Increase Request",
      description: "Requesting additional storage for project files",
      type: "resource",
      status: "in_review",
      priority: "medium",
      requestedBy: "user_backend_lead",
      assignedTo: "admin_1",
      orgUnitId: "org_team_backend",
      data: { resourceType: "storage", requestedQuota: 200, currentQuota: 100, reason: "Project growth" },
      attachments: [],
      comments: [
        {
          id: "comment_1",
          userId: "user_backend_lead",
          content: "We need more storage for the new ML models",
          createdAt,
          updatedAt: createdAt
        }
      ],
      slaDeadline: plusDays(5)
    },
    {
      id: "req_access_prod",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Production Database Access",
      description: "Requesting read-only access to production database for debugging",
      type: "access",
      status: "in_review",
      priority: "high",
      requestedBy: "user_frontend_dev",
      orgUnitId: "org_team_frontend",
      data: { system: "production_db", accessLevel: "read_only", duration: "7_days" },
      attachments: [],
      comments: [],
      slaDeadline: plusDays(2)
    },
    {
      id: "req_feature_approval",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Enable AI Features for Team",
      description: "Request to enable AI features for frontend team",
      type: "change",
      status: "approved",
      priority: "low",
      requestedBy: "user_team_lead",
      assignedTo: "admin_1",
      orgUnitId: "org_team_frontend",
      data: { featureKey: "ai_assistant", targetUsers: 6 },
      attachments: [],
      comments: [
        {
          id: "comment_2",
          userId: "admin_1",
          content: "Approved. Will be enabled in next deployment.",
          createdAt,
          updatedAt: createdAt
        }
      ],
      completedAt: createdAt
    }
  );

  state.approvals.push(
    {
      id: "approval_storage_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Storage Increase Approval",
      description: "Multi-level approval for storage quota increase",
      type: "resource",
      status: "pending",
      requestId: "req_storage_increase",
      requestedBy: "user_backend_lead",
      workflow: [
        { step: 1, approverRole: "resource_manager", status: "pending" },
        { step: 2, approverRole: "admin", status: "pending" }
      ],
      currentStep: 1,
      metadata: {}
    },
    {
      id: "approval_access_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Production Access Approval",
      description: "Security approval for production database access",
      type: "access",
      status: "approved",
      requestId: "req_access_prod",
      requestedBy: "user_frontend_dev",
      approvedBy: "admin_1",
      decisionAt: createdAt,
      reason: "Valid business reason provided",
      workflow: [
        { step: 1, approverId: "admin_1", approverRole: "admin", status: "approved", decisionAt: createdAt, reason: "Valid business reason provided" }
      ],
      currentStep: 1,
      metadata: {}
    }
  );

  state.events.push({
    id: "event_admin_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "adminos.seeded",
    source: "AdminOS",
    actorId: "system",
    data: { message: "AdminOS demo data seeded" }
  });

  return state;
}
