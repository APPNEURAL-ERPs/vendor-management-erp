export function docs() {
  return {
    name: "GovernanceOS",
    version: "1.0.0",
    description: "Board governance, policies, board meetings, resolutions, and corporate governance",
    auth: {
      headers: {
        "x-role": "owner | admin | governance_admin | board_secretary | director | compliance_officer | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      director: "A member of the board with specific roles and responsibilities",
      committee: "A specialized group within the board focusing on specific governance areas",
      boardMeeting: "Formal meetings of directors to discuss and decide on matters",
      resolution: "Formal decisions made by the board or shareholders",
      policy: "Governance policies and procedures that guide organizational behavior",
      raciMatrix: "Responsibility assignment matrix showing who is Responsible, Accountable, Consulted, Informed",
      approvalMatrix: "Rules defining approval workflows for different types of requests",
      decision: "Tracked decisions with options, rationale, and ownership",
      riskOwnership: "Risk identification with assigned owners and mitigation plans",
      exception: "Controlled deviations from policies requiring approval"
    },
    examples: {
      createMeeting: {
        method: "POST",
        path: "/governanceos/meetings",
        headers: { "x-role": "board_secretary" },
        body: {
          meetingNumber: "BM-2024-001",
          title: "Q1 Board Meeting",
          meetingType: "quarterly",
          scheduledAt: "2024-03-15T10:00:00Z"
        }
      },
      createResolution: {
        method: "POST",
        path: "/governanceos/resolutions",
        headers: { "x-role": "governance_admin" },
        body: {
          resolutionNumber: "RES-2024-001",
          title: "Approve Annual Budget",
          resolutionType: "ordinary"
        }
      },
      createPolicy: {
        method: "POST",
        path: "/governanceos/policies",
        headers: { "x-role": "compliance_officer" },
        body: {
          key: "code-of-conduct",
          name: "Code of Conduct Policy",
          category: "code_of_conduct",
          content: "This policy outlines the expected behavior..."
        }
      }
    }
  };
}
