export function docs() {
  return {
    name: "AdminOS",
    version: "1.0.0",
    description: "Administrative control center for settings, resources, approvals, operations, and internal configuration.",
    auth: {
      headers: {
        "x-role": "viewer | admin | org_admin | approval_manager | resource_manager | owner",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      adminSetting: "Platform-wide or tenant-specific configuration settings with categories and value types.",
      orgUnit: "Hierarchical organization units (company, branch, department, team) for multi-tenant or multi-division management.",
      internalRequest: "Internal workflow requests for access, resources, approvals, support, changes, or incidents.",
      resourceRecord: "Allocatable resources (storage, compute, bandwidth, API calls, users) with quota tracking.",
      adminApproval: "Multi-step approval workflows for requests with status tracking and decision history."
    },
    examples: {
      createSetting: {
        method: "POST",
        path: "/adminos/settings",
        headers: { "x-role": "admin" },
        body: { key: "max_users", name: "Maximum Users", value: 100, valueType: "number", category: "general" }
      },
      createOrgUnit: {
        method: "POST",
        path: "/adminos/org-units",
        headers: { "x-role": "org_admin" },
        body: { name: "Engineering Department", type: "department", parentId: "org_company_1" }
      },
      createRequest: {
        method: "POST",
        path: "/adminos/requests",
        headers: { "x-role": "admin" },
        body: { title: "Storage Increase Request", type: "resource", priority: "high", requestedBy: "user_1", data: { resourceType: "storage", requestedQuota: 500 } }
      },
      allocateResource: {
        method: "POST",
        path: "/adminos/resources",
        headers: { "x-role": "resource_manager" },
        body: { name: "Storage Quota", type: "storage", quota: 1000, used: 0, unit: "GB" }
      },
      approveRequest: {
        method: "POST",
        path: "/adminos/approvals",
        headers: { "x-role": "approval_manager" },
        body: { name: "Resource Request Approval", type: "resource", requestedBy: "user_1", workflow: [{ step: 1, approverRole: "approval_manager" }] }
      }
    }
  };
}
