import { ClientState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, newId } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): ClientState {
  const state = emptyState();
  const createdAt = nowIso();

  state.clients.push(
    {
      id: "client_acme",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "ACME Technologies",
      status: "active",
      ownerId: "user_manager",
      segment: "enterprise",
      priority: "high",
      tags: ["ai", "automation", "enterprise"],
      source: "referral",
      healthScore: 85,
      lifetimeValue: 150000,
      renewalDate: "2026-12-31T00:00:00.000Z",
      nextAction: "Schedule quarterly review",
      nextActionDate: "2026-06-01T00:00:00.000Z"
    },
    {
      id: "client_globex",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Globex Corporation",
      status: "proposal_sent",
      ownerId: "user_manager",
      segment: "mid-market",
      priority: "medium",
      tags: ["saas", "api"],
      source: "website",
      healthScore: 60,
      nextAction: "Follow up on proposal",
      nextActionDate: "2026-05-25T00:00:00.000Z"
    },
    {
      id: "client_initech",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Initech Solutions",
      status: "qualified",
      segment: "smb",
      priority: "low",
      tags: ["startup", "web"],
      source: "linkedin",
      healthScore: 40
    }
  );

  state.contacts.push(
    {
      id: "contact_acme_ceo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      name: "John Smith",
      email: "john.smith@acme.com",
      phone: "+1-555-0100",
      role: "CEO",
      isPrimary: true,
      status: "active"
    },
    {
      id: "contact_acme_cto",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      name: "Sarah Johnson",
      email: "sarah.johnson@acme.com",
      phone: "+1-555-0101",
      role: "CTO",
      isPrimary: false,
      status: "active"
    },
    {
      id: "contact_globex_pm",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_globex",
      name: "Mike Davis",
      email: "mike.davis@globex.com",
      phone: "+1-555-0200",
      role: "Product Manager",
      isPrimary: true,
      status: "active"
    }
  );

  state.companies.push(
    {
      id: "company_acme",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      name: "ACME Technologies Inc.",
      industry: "Technology",
      size: "500-1000",
      website: "https://acme.com",
      address: "123 Tech Street, San Francisco, CA"
    },
    {
      id: "company_globex",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_globex",
      name: "Globex Corporation",
      industry: "SaaS",
      size: "50-200",
      website: "https://globex.com"
    }
  );

  state.accounts.push({
    id: "account_acme",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    clientId: "client_acme",
    name: "ACME Enterprise Account",
    type: "enterprise",
    status: "active",
    billingEmail: "billing@acme.com",
    paymentTerms: "net-30",
    creditLimit: 500000,
    balance: 25000,
    metadata: {}
  });

  state.projects.push({
    id: "project_acme_ai",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    clientId: "client_acme",
    accountId: "account_acme",
    name: "AI Automation Platform",
    description: "Custom AI automation and workflow system for ACME",
    status: "active",
    startDate: "2026-01-15T00:00:00.000Z",
    targetDate: "2026-07-15T00:00:00.000Z",
    budget: 200000,
    spent: 75000,
    currency: "USD",
    ownerId: "user_pm",
    tags: ["ai", "automation", "integration"],
    metadata: {}
  });

  state.deliverables.push(
    {
      id: "deliverable_acme_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      projectId: "project_acme_ai",
      clientId: "client_acme",
      title: "AI Model Architecture Design",
      description: "Design document for AI model selection and architecture",
      status: "delivered",
      dueDate: "2026-02-15T00:00:00.000Z",
      deliveredDate: "2026-02-14T00:00:00.000Z",
      approvedBy: "contact_acme_cto",
      approvedAt: "2026-02-14T00:00:00.000Z",
      version: 1,
      tags: ["design", "ai"],
      metadata: {}
    },
    {
      id: "deliverable_acme_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      projectId: "project_acme_ai",
      clientId: "client_acme",
      title: "MVP Implementation",
      description: "Initial MVP with core automation features",
      status: "in_review",
      dueDate: "2026-06-01T00:00:00.000Z",
      version: 1,
      tags: ["development", "mvp"],
      metadata: {}
    }
  );

  state.meetings.push(
    {
      id: "meeting_acme_kickoff",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      projectId: "project_acme_ai",
      title: "Project Kickoff Meeting",
      description: "Initial meeting to align on project goals and timeline",
      type: "kickoff",
      status: "completed",
      scheduledAt: "2026-01-15T10:00:00.000Z",
      duration: 60,
      location: "Conference Room A",
      attendeeIds: ["user_manager", "user_pm", "contact_acme_ceo", "contact_acme_cto"],
      attendeeNames: ["Manager", "PM", "John Smith", "Sarah Johnson"],
      notes: "Discussed project scope, timeline, and key milestones",
      summary: "Project kickoff completed successfully. Team aligned on goals.",
      actionItems: ["Create project plan", "Set up communication channels", "Schedule weekly standups"],
      metadata: {}
    },
    {
      id: "meeting_acme_review",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      projectId: "project_acme_ai",
      title: "Monthly Status Review",
      description: "Review progress and discuss upcoming milestones",
      type: "status",
      status: "scheduled",
      scheduledAt: "2026-06-01T14:00:00.000Z",
      duration: 45,
      meetingLink: "https://meet.acme.com/review",
      attendeeIds: ["user_manager", "user_pm", "contact_acme_cto"],
      attendeeNames: ["Manager", "PM", "Sarah Johnson"],
      metadata: {}
    }
  );

  state.requirements.push(
    {
      id: "req_acme_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      projectId: "project_acme_ai",
      title: "AI-Powered Workflow Automation",
      description: "System should automatically trigger workflows based on user actions and data patterns",
      category: "feature",
      priority: "high",
      status: "approved",
      source: "discovery",
      tags: ["ai", "automation"],
      metadata: {}
    },
    {
      id: "req_acme_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      projectId: "project_acme_ai",
      title: "Real-time Analytics Dashboard",
      description: "Dashboard showing workflow performance and AI model accuracy",
      category: "feature",
      priority: "medium",
      status: "approved",
      tags: ["analytics", "dashboard"],
      metadata: {}
    }
  );

  state.proposals.push({
    id: "proposal_globex",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    clientId: "client_globex",
    title: "API Integration Platform",
    description: "Custom API integration platform for Globex",
    status: "sent",
    version: 1,
    scope: "Design and develop API integration platform with 10+ connectors",
    deliverables: ["API Gateway", "Connector Library", "Admin Dashboard", "Documentation"],
    timeline: "6 months",
    pricing: 180000,
    currency: "USD",
    validUntil: "2026-06-30T00:00:00.000Z",
    sentAt: "2026-05-10T00:00:00.000Z",
    metadata: {}
  });

  state.contracts.push({
    id: "contract_acme",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    clientId: "client_acme",
    proposalId: "proposal_acme",
    title: "AI Automation Platform Development",
    type: "project",
    status: "active",
    value: 200000,
    currency: "USD",
    startDate: "2026-01-15T00:00:00.000Z",
    endDate: "2026-07-15T00:00:00.000Z",
    signedDate: "2026-01-10T00:00:00.000Z",
    autoRenew: false,
    terms: "Standard service agreement terms",
    metadata: {}
  });

  state.healthScores.push({
    id: "health_acme",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    clientId: "client_acme",
    overallScore: 85,
    engagementScore: 90,
    paymentScore: 95,
    communicationScore: 85,
    satisfactionScore: 80,
    deliveryScore: 75,
    riskLevel: "low",
    factors: [
      { factor: "Regular meetings", impact: "positive", weight: 20, note: "Bi-weekly sync meetings" },
      { factor: "On-time payments", impact: "positive", weight: 25, note: "Always pays on time" },
      { factor: "Clear requirements", impact: "positive", weight: 15, note: "CTO provides clear specs" },
      { factor: "MVP delayed", impact: "negative", weight: -15, note: "2 weeks behind schedule" },
      { factor: "Active engagement", impact: "positive", weight: 20 }
    ],
    risks: ["MVP delivery timeline"],
    recommendations: ["Accelerate MVP delivery", "Schedule milestone review"],
    nextReviewDate: "2026-06-15T00:00:00.000Z",
    metadata: {}
  });

  state.successPlans.push({
    id: "success_acme",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    clientId: "client_acme",
    title: "ACME Platform Success Plan",
    description: "Plan to ensure successful delivery and long-term partnership",
    status: "active",
    goals: [
      {
        id: "goal_1",
        title: "Deliver MVP on time",
        description: "Complete MVP by June 2026",
        targetDate: "2026-06-15T00:00:00.000Z",
        status: "in_progress",
        progress: 60,
        metrics: "60% feature completion"
      },
      {
        id: "goal_2",
        title: "Achieve 90% client satisfaction",
        description: "Maintain high satisfaction through regular check-ins",
        targetDate: "2026-12-31T00:00:00.000Z",
        status: "not_started",
        progress: 0,
        metrics: "Survey results"
      }
    ],
    milestones: [
      {
        id: "milestone_1",
        title: "Design Phase Complete",
        targetDate: "2026-02-28T00:00:00.000Z",
        status: "completed",
        completedAt: "2026-02-25T00:00:00.000Z"
      },
      {
        id: "milestone_2",
        title: "MVP Delivery",
        targetDate: "2026-06-15T00:00:00.000Z",
        status: "pending"
      }
    ],
    checkIns: [
      {
        id: "checkin_1",
        date: "2026-05-01T00:00:00.000Z",
        notes: "Progressing well, MVP 60% complete",
        outcomes: "Continue current trajectory"
      }
    ],
    ownerId: "user_manager",
    metadata: {}
  });

  state.supportTickets.push({
    id: "ticket_acme_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    clientId: "client_acme",
    projectId: "project_acme_ai",
    title: "API Integration Issue",
    description: "Third-party API integration returning 500 errors",
    type: "bug",
    priority: "high",
    status: "in_progress",
    assigneeId: "user_dev",
    assigneeName: "Developer",
    tags: ["api", "bug", "urgent"],
    metadata: {}
  });

  state.invoices.push(
    {
      id: "invoice_acme_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      projectId: "project_acme_ai",
      accountId: "account_acme",
      number: "INV-2026-001",
      title: "Project Milestone 1",
      amount: 50000,
      tax: 5000,
      total: 55000,
      currency: "USD",
      status: "paid",
      issueDate: "2026-02-01T00:00:00.000Z",
      dueDate: "2026-03-01T00:00:00.000Z",
      paidDate: "2026-02-28T00:00:00.000Z",
      paidAmount: 55000,
      metadata: {}
    },
    {
      id: "invoice_acme_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      projectId: "project_acme_ai",
      accountId: "account_acme",
      number: "INV-2026-002",
      title: "Project Milestone 2",
      amount: 50000,
      tax: 5000,
      total: 55000,
      currency: "USD",
      status: "pending",
      issueDate: "2026-05-01T00:00:00.000Z",
      dueDate: "2026-05-31T00:00:00.000Z",
      metadata: {}
    }
  );

  state.risks.push({
    id: "risk_acme_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    clientId: "client_acme",
    projectId: "project_acme_ai",
    title: "MVP Timeline Delay",
    description: "Current development pace may result in 2-week delay",
    category: "timeline",
    severity: "medium",
    status: "mitigating",
    ownerId: "user_pm",
    mitigationPlan: "Add additional developer for final sprint",
    identifiedAt: "2026-05-15T00:00:00.000Z",
    metadata: {}
  });

  state.notes.push({
    id: "note_acme_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    clientId: "client_acme",
    projectId: "project_acme_ai",
    title: "Key Technical Decisions",
    content: "CTO prefers REST over GraphQL. Need to use PostgreSQL as primary database.",
    authorId: "user_pm",
    authorName: "PM",
    visibility: "team",
    tags: ["technical", "architecture"],
    metadata: {}
  });

  state.documents.push(
    {
      id: "doc_acme_proposal",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      title: "AI Platform Proposal v1.2",
      type: "proposal",
      status: "signed",
      version: 3,
      uploadedBy: "user_manager",
      approvedBy: "contact_acme_ceo",
      approvedAt: "2026-01-10T00:00:00.000Z",
      tags: ["proposal", "signed"],
      metadata: {}
    },
    {
      id: "doc_acme_contract",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      clientId: "client_acme",
      title: "Master Service Agreement",
      type: "contract",
      status: "active",
      version: 1,
      uploadedBy: "user_manager",
      approvedBy: "contact_acme_ceo",
      approvedAt: "2026-01-10T00:00:00.000Z",
      tags: ["contract", "msa"],
      metadata: {}
    }
  );

  state.approvals.push({
    id: "approval_acme_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    clientId: "client_acme",
    projectId: "project_acme_ai",
    deliverableId: "deliverable_acme_2",
    type: "delivery",
    title: "MVP Implementation Approval",
    description: "Requesting approval for MVP implementation deliverable",
    status: "pending",
    requestedBy: "user_pm",
    requestedAt: "2026-05-20T00:00:00.000Z",
    metadata: {}
  });

  state.tasks.push(
    {
      id: "task_acme_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      projectId: "project_acme_ai",
      clientId: "client_acme",
      title: "Implement API Gateway",
      description: "Build REST API gateway with authentication",
      status: "done",
      priority: "high",
      assigneeId: "user_dev",
      dueDate: "2026-03-15T00:00:00.000Z",
      completedAt: "2026-03-14T00:00:00.000Z",
      estimatedHours: 40,
      actualHours: 38,
      tags: ["development", "api"],
      metadata: {}
    },
    {
      id: "task_acme_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      projectId: "project_acme_ai",
      clientId: "client_acme",
      title: "Integrate AI Models",
      description: "Integrate OpenAI and custom ML models",
      status: "in_progress",
      priority: "high",
      assigneeId: "user_dev",
      dueDate: "2026-06-01T00:00:00.000Z",
      estimatedHours: 60,
      tags: ["ai", "integration"],
      metadata: {}
    },
    {
      id: "task_acme_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      projectId: "project_acme_ai",
      clientId: "client_acme",
      title: "User Acceptance Testing",
      description: "Coordinate UAT with client stakeholders",
      status: "planned",
      priority: "medium",
      dueDate: "2026-06-10T00:00:00.000Z",
      estimatedHours: 20,
      tags: ["testing", "uat"],
      metadata: {}
    }
  );

  state.events.push({
    id: "event_clientos_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "clientos.seeded",
    source: "ClientOS",
    data: { message: "ClientOS demo data seeded" }
  });

  return state;
}
