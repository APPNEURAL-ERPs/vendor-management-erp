import { GovernanceState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { newId, nowIso, plusDays } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): GovernanceState {
  const state = emptyState();
  const createdAt = nowIso();

  state.directors.push(
    {
      id: "director_ceo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ceo",
      name: "John Smith",
      email: "john.smith@appneural.com",
      title: "Chief Executive Officer",
      directorType: "executive",
      status: "active",
      committeeIds: ["committee_executive"],
      metadata: { department: "Executive", appointedDate: "2020-01-15" }
    },
    {
      id: "director_cfo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "cfo",
      name: "Sarah Johnson",
      email: "sarah.johnson@appneural.com",
      title: "Chief Financial Officer",
      directorType: "executive",
      status: "active",
      committeeIds: ["committee_audit", "committee_executive"],
      metadata: { department: "Finance", appointedDate: "2019-06-01" }
    },
    {
      id: "director_independent_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "independent_1",
      name: "Michael Chen",
      email: "michael.chen@independent.com",
      title: "Independent Director",
      directorType: "independent",
      status: "active",
      committeeIds: ["committee_audit", "committee_compensation"],
      metadata: { expertise: "Technology", appointedDate: "2021-03-20" }
    },
    {
      id: "director_independent_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "independent_2",
      name: "Emily Davis",
      email: "emily.davis@independent.com",
      title: "Independent Director",
      directorType: "independent",
      status: "active",
      committeeIds: ["committee_nomination", "committee_risk"],
      metadata: { expertise: "Finance", appointedDate: "2022-01-10" }
    }
  );

  state.committees.push(
    {
      id: "committee_executive",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "executive_committee",
      name: "Executive Committee",
      description: "Oversees day-to-day operations and strategic initiatives",
      committeeType: "executive",
      chairId: "director_ceo",
      memberIds: ["director_ceo", "director_cfo"],
      status: "active",
      meetingFrequency: "Weekly",
      metadata: {}
    },
    {
      id: "committee_audit",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "audit_committee",
      name: "Audit Committee",
      description: "Oversees financial reporting, internal controls, and audit functions",
      committeeType: "audit",
      chairId: "director_independent_1",
      memberIds: ["director_cfo", "director_independent_1"],
      status: "active",
      meetingFrequency: "Quarterly",
      metadata: { charter: "Financial oversight and compliance" }
    },
    {
      id: "committee_compensation",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "compensation_committee",
      name: "Compensation Committee",
      description: "Reviews and approves executive compensation packages",
      committeeType: "compensation",
      chairId: "director_independent_1",
      memberIds: ["director_independent_1"],
      status: "active",
      meetingFrequency: "Semi-annually",
      metadata: {}
    },
    {
      id: "committee_risk",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "risk_committee",
      name: "Risk Committee",
      description: "Identifies and manages organizational risks",
      committeeType: "risk",
      chairId: "director_independent_2",
      memberIds: ["director_independent_2"],
      status: "active",
      meetingFrequency: "Quarterly",
      metadata: {}
    }
  );

  state.meetings.push(
    {
      id: "meeting_q1_2024",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      meetingNumber: "BM-2024-Q1",
      title: "Q1 2024 Board Meeting",
      meetingType: "quarterly",
      scheduledAt: "2024-03-15T10:00:00Z",
      status: "completed",
      attendeeIds: ["director_ceo", "director_cfo", "director_independent_1", "director_independent_2"],
      absentAttendeeIds: [],
      agendaItems: [
        {
          id: newId("agenda"),
          itemNumber: "1",
          title: "Financial Performance Review",
          description: "Review Q4 2023 and Q1 2024 financials",
          presenterId: "director_cfo",
          order: 1,
          duration: 60,
          attachments: ["Q1_Financial_Report.pdf"]
        },
        {
          id: newId("agenda"),
          itemNumber: "2",
          title: "Strategic Initiatives Update",
          description: "Progress on key strategic initiatives",
          presenterId: "director_ceo",
          order: 2,
          duration: 45,
          attachments: []
        }
      ],
      resolutions: ["resolution_budget_2024"],
      minutes: "Meeting discussed financial performance and strategic initiatives. All items were approved.",
      approvedAt: "2024-03-20T14:00:00Z",
      approvedBy: "director_ceo",
      createdBy: "director_ceo"
    },
    {
      id: "meeting_annual_2024",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      meetingNumber: "BM-2024-ANNUAL",
      title: "Annual General Meeting 2024",
      meetingType: "annual",
      scheduledAt: "2024-06-30T09:00:00Z",
      status: "scheduled",
      attendeeIds: ["director_ceo", "director_cfo", "director_independent_1", "director_independent_2"],
      absentAttendeeIds: [],
      agendaItems: [
        {
          id: newId("agenda"),
          itemNumber: "1",
          title: "Annual Report",
          description: "Presentation of annual report",
          presenterId: "director_ceo",
          order: 1,
          duration: 30,
          attachments: []
        }
      ],
      resolutions: [],
      createdBy: "director_ceo"
    }
  );

  state.resolutions.push(
    {
      id: "resolution_budget_2024",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      resolutionNumber: "RES-2024-001",
      title: "Approve Annual Budget FY2024",
      description: "Resolution to approve the annual budget for fiscal year 2024",
      resolutionType: "ordinary",
      meetingId: "meeting_q1_2024",
      proposedBy: "director_cfo",
      status: "approved",
      votingResults: {
        totalVotes: 4,
        votesFor: 4,
        votesAgainst: 0,
        abstentions: 0,
        voters: [
          { voterId: "director_ceo", voterName: "John Smith", vote: "for", timestamp: nowIso() },
          { voterId: "director_cfo", voterName: "Sarah Johnson", vote: "for", timestamp: nowIso() },
          { voterId: "director_independent_1", voterName: "Michael Chen", vote: "for", timestamp: nowIso() },
          { voterId: "director_independent_2", voterName: "Emily Davis", vote: "for", timestamp: nowIso() }
        ]
      },
      effectiveDate: "2024-01-01T00:00:00Z",
      approvedAt: "2024-03-15T12:00:00Z",
      approvedBy: "director_ceo",
      createdBy: "director_cfo",
      metadata: { amount: 5000000, currency: "USD" }
    },
    {
      id: "resolution_compensation_plan",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      resolutionNumber: "RES-2024-002",
      title: "Approve Executive Compensation Plan",
      description: "Resolution to approve the updated executive compensation package",
      resolutionType: "special",
      proposedBy: "director_independent_1",
      status: "proposed",
      votingResults: undefined,
      createdBy: "director_independent_1",
      metadata: {}
    }
  );

  state.policies.push(
    {
      id: "policy_code_of_conduct",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "code-of-conduct",
      name: "Code of Conduct Policy",
      description: "Defines ethical standards and professional behavior expected from all employees",
      category: "code_of_conduct",
      policyType: "internal",
      ownerId: "director_independent_2",
      status: "active",
      version: 3,
      effectiveDate: "2023-01-01T00:00:00Z",
      reviewDate: plusDays(180),
      content: "All employees are expected to conduct themselves with integrity, honesty, and professionalism...",
      attachments: [],
      acknowledgments: [],
      exceptions: [],
      metadata: { lastReviewedBy: "Emily Davis", reviewCycle: "annual" }
    },
    {
      id: "policy_data_privacy",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "data-privacy",
      name: "Data Privacy and Protection Policy",
      description: "Guidelines for handling and protecting sensitive data",
      category: "compliance",
      policyType: "regulatory",
      ownerId: "director_cfo",
      status: "active",
      version: 2,
      effectiveDate: "2023-06-01T00:00:00Z",
      reviewDate: plusDays(90),
      content: "This policy establishes guidelines for the collection, storage, and processing of personal data...",
      attachments: ["GDPR_Compliance.pdf"],
      acknowledgments: [],
      exceptions: [],
      metadata: { complianceFramework: "GDPR, CCPA" }
    },
    {
      id: "policy_information_security",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "information-security",
      name: "Information Security Policy",
      description: "Comprehensive information security guidelines",
      category: "security",
      policyType: "internal",
      ownerId: "director_ceo",
      status: "draft",
      version: 1,
      content: "Information security is paramount to protect company assets...",
      attachments: [],
      acknowledgments: [],
      exceptions: [],
      metadata: {}
    }
  );

  state.decisions.push(
    {
      id: "decision_cloud_platform",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      decisionNumber: "DEC-2024-001",
      title: "Select Cloud Infrastructure Provider",
      description: "Decision to select primary cloud platform for infrastructure migration",
      category: "architecture",
      status: "decided",
      ownerId: "director_ceo",
      priority: "high",
      deadline: "2024-02-28T00:00:00Z",
      options: [
        {
          id: newId("option"),
          title: "AWS",
          description: "Amazon Web Services for all infrastructure",
          pros: "Market leader, extensive services",
          cons: "Higher cost",
          estimatedCost: 500000,
          timeline: "6 months"
        },
        {
          id: newId("option"),
          title: "Azure",
          description: "Microsoft Azure for integrated solution",
          pros: "Good Microsoft integration",
          cons: "Limited regions",
          estimatedCost: 450000,
          timeline: "8 months"
        }
      ],
      selectedOptionId: undefined,
      rationale: "Selected AWS for its comprehensive service offerings and market leadership",
      approvedBy: "director_ceo",
      decidedAt: "2024-02-15T10:00:00Z",
      impact: "Improved scalability and reduced infrastructure costs",
      risks: "Vendor lock-in risk",
      createdBy: "director_ceo"
    }
  );

  state.riskOwnerships.push(
    {
      id: newId("risk"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      riskId: "RISK-001",
      title: "Cybersecurity Threat",
      description: "Potential for sophisticated cyber attacks",
      category: "technical",
      severity: "critical",
      likelihood: "possible",
      status: "mitigated",
      ownerId: "director_ceo",
      mitigationPlan: "Implemented advanced security monitoring and regular penetration testing",
      reviewDate: plusDays(90),
      acceptedBy: undefined,
      acceptanceDate: undefined
    },
    {
      id: newId("risk"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      riskId: "RISK-002",
      title: "Regulatory Compliance Gap",
      description: "Potential non-compliance with new regulations",
      category: "compliance",
      severity: "high",
      likelihood: "likely",
      status: "identified",
      ownerId: "director_independent_2",
      mitigationPlan: "Engaged compliance consultant to assess gaps",
      reviewDate: plusDays(60)
    }
  );

  state.exceptions.push(
    {
      id: newId("exception"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      exceptionNumber: "EXC-2024-001",
      title: "Emergency Procurement Approval",
      description: "Emergency procurement without standard approval process",
      exceptionType: "approval",
      requestedBy: "director_ceo",
      requestedByName: "John Smith",
      status: "approved",
      riskAssessment: "Low risk - one-time emergency situation",
      approvedBy: "director_independent_1",
      approvedAt: "2024-02-20T15:00:00Z",
      expiryDate: "2024-02-25T00:00:00Z",
      conditions: "Must complete post-procurement review",
      metadata: {}
    }
  );

  state.approvalMatrices.push(
    {
      id: newId("approval"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "expense_approval",
      name: "Expense Approval Matrix",
      description: "Defines approval rules for different expense thresholds",
      category: "expense",
      rules: [
        {
          id: newId("rule"),
          condition: "expense <= 5000",
          maxAmount: 5000,
          approverIds: ["director_ceo"],
          requiresMultiple: false
        },
        {
          id: newId("rule"),
          condition: "expense > 5000 AND expense <= 50000",
          minAmount: 5000,
          maxAmount: 50000,
          riskLevel: "medium",
          approverIds: ["director_ceo", "director_cfo"],
          escalationTimeout: 72,
          requiresMultiple: true
        },
        {
          id: newId("rule"),
          condition: "expense > 50000",
          minAmount: 50000,
          riskLevel: "high",
          approverIds: ["director_independent_1", "director_independent_2"],
          escalationTimeout: 48,
          requiresMultiple: true
        }
      ],
      status: "active",
      createdBy: "director_cfo"
    }
  );

  state.events.push({
    id: newId("event"),
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "governance.seeded",
    source: "GovernanceOS",
    data: { message: "GovernanceOS demo data seeded" }
  });

  return state;
}
