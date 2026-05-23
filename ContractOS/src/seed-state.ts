import { ContractState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { nowIso, plusDays } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): ContractState {
  const state = emptyState();
  const createdAt = nowIso();
  const in30Days = plusDays(30);
  const in60Days = plusDays(60);
  const in90Days = plusDays(90);
  const in365Days = plusDays(365);
  const in120Days = plusDays(120);
  const in425Days = plusDays(425);
  const pastDate = plusDays(-30);

  state.parties.push(
    {
      id: "party_abc_corp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "ABC Technologies Pvt Ltd",
      legalName: "ABC Technologies Private Limited",
      email: "legal@abctech.com",
      phone: "+91-9876543210",
      address: "123 Tech Park, Bangalore, Karnataka 560001",
      taxId: "29AABCU9603R1ZM",
      role: "client",
      authorizedSignatory: "Rajesh Kumar, CEO",
      status: "verified",
      metadata: {}
    },
    {
      id: "party_xyz_inc",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "XYZ Consulting Inc",
      legalName: "XYZ Consulting Incorporated",
      email: "contracts@xyzconsulting.com",
      phone: "+1-555-123-4567",
      address: "456 Business Ave, San Francisco, CA 94105",
      taxId: "12-3456789",
      role: "partner",
      authorizedSignatory: "John Smith, VP Partnerships",
      status: "verified",
      metadata: {}
    },
    {
      id: "party_vendor_cloud",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "CloudFirst Solutions",
      email: "sales@cloudfirst.io",
      phone: "+91-9876543211",
      address: "789 Cloud Street, Hyderabad 500001",
      role: "vendor",
      status: "pending",
      metadata: {}
    },
    {
      id: "party_appneuro",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "APPNEURAL Engineering",
      email: "legal@appneural.com",
      role: "service_provider",
      authorizedSignatory: "Ajay Prajapat, CEO",
      status: "verified",
      metadata: {}
    }
  );

  state.clauses.push(
    {
      id: "clause_payment",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "payment_terms",
      name: "Standard Payment Terms",
      category: "Payment",
      content: "Payment shall be due within 7 (seven) days of invoice date. Late payments shall attract interest @ 18% per annum.",
      riskLevel: "medium",
      status: "active",
      tags: ["payment", "standard", "finance"],
      version: 1,
      metadata: {}
    },
    {
      id: "clause_ip",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "intellectual_property",
      name: "IP Ownership Clause",
      category: "Intellectual Property",
      content: "Upon full payment, all deliverables and intellectual property shall vest in the Client. APPNEURAL retains rights to pre-existing tools and frameworks.",
      riskLevel: "low",
      status: "active",
      tags: ["ip", "ownership", "deliverables"],
      version: 1,
      metadata: {}
    },
    {
      id: "clause_confidentiality",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "confidentiality",
      name: "Confidentiality Agreement",
      category: "Confidentiality",
      content: "Both parties agree to maintain strict confidentiality of all proprietary information exchanged during the term of this Agreement for a period of 3 (three) years post-termination.",
      riskLevel: "low",
      status: "active",
      tags: ["confidentiality", "nda", "privacy"],
      version: 2,
      metadata: {}
    },
    {
      id: "clause_termination",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "termination",
      name: "Termination Clause",
      category: "Termination",
      content: "Either party may terminate this Agreement with 30 (thirty) days written notice. Upon termination, all outstanding payments become immediately due.",
      riskLevel: "medium",
      status: "active",
      tags: ["termination", "exit", "notice"],
      version: 1,
      metadata: {}
    },
    {
      id: "clause_liability",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "liability_cap",
      name: "Liability Limitation",
      category: "Liability",
      content: "Total liability under this Agreement shall not exceed the total fees paid in the 12 (twelve) months preceding the claim. Neither party shall be liable for indirect, consequential, or punitive damages.",
      riskLevel: "high",
      status: "active",
      tags: ["liability", "limitation", "risk"],
      version: 1,
      metadata: {}
    },
    {
      id: "clause_sla",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "sla_standard",
      name: "Standard SLA Terms",
      category: "Service Level",
      content: "Support response within 4 business hours. Bug fixes within 2 business days for critical issues. Monthly service credits of 5% for each hour of downtime beyond 99.9% uptime target.",
      riskLevel: "medium",
      status: "active",
      tags: ["sla", "support", "uptime"],
      version: 1,
      metadata: {}
    }
  );

  state.templates.push(
    {
      id: "template_service_agreement",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "service_agreement_standard",
      name: "Standard Service Agreement",
      description: "General service agreement template for web development, software, and consulting services",
      type: "service_agreement",
      content: "This Service Agreement is entered into between [CLIENT] and APPNEURAL Engineering...",
      clauses: ["clause_payment", "clause_ip", "clause_confidentiality", "clause_termination", "clause_liability", "clause_sla"],
      status: "active",
      tags: ["service", "development", "consulting"],
      version: 3,
      metadata: {}
    },
    {
      id: "template_nda",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "nda_standard",
      name: "Non-Disclosure Agreement",
      description: "Mutual NDA for protecting confidential information during discussions",
      type: "nda",
      content: "This Non-Disclosure Agreement is entered into for protecting proprietary information...",
      clauses: ["clause_confidentiality", "clause_termination"],
      status: "active",
      tags: ["nda", "confidentiality", "mutual"],
      version: 2,
      metadata: {}
    },
    {
      id: "template_msa",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "msa_standard",
      name: "Master Service Agreement",
      description: "Framework agreement for ongoing service relationships with multiple SOWs",
      type: "msa",
      content: "This Master Service Agreement establishes the terms for future Statements of Work...",
      clauses: ["clause_payment", "clause_ip", "clause_confidentiality", "clause_termination", "clause_liability", "clause_sla"],
      status: "active",
      tags: ["msa", "master", "framework"],
      version: 2,
      metadata: {}
    }
  );

  state.contracts.push(
    {
      id: "contract_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "ABC Corp Website Development Agreement",
      type: "service_agreement",
      status: "active",
      description: "Full-stack website development including design, frontend, backend, and deployment",
      effectiveDate: pastDate,
      expiryDate: in60Days,
      value: 800000,
      currency: "INR",
      paymentTerms: "30% advance, 40% at MVP, 30% at final delivery",
      renewalTerms: "Auto-renewal with 30 days notice",
      governingLaw: "India",
      terminationTerms: "30 days written notice",
      partyIds: ["party_abc_corp", "party_appneuro"],
      clauseIds: ["clause_payment", "clause_ip", "clause_confidentiality", "clause_termination"],
      templateId: "template_service_agreement",
      version: 1,
      currentVersionId: "version_001_1",
      ownerId: "contract_manager",
      locked: false,
      tags: ["website", "development", "priority"],
      metadata: { priority: "high", dealId: "sales_001" },
      createdBy: "contract_manager"
    },
    {
      id: "contract_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "XYZ Partnership Agreement",
      type: "partner_agreement",
      status: "negotiation",
      description: "Technology partnership for joint product development",
      effectiveDate: in30Days,
      expiryDate: in365Days,
      value: 1500000,
      currency: "USD",
      paymentTerms: "Quarterly payments",
      partyIds: ["party_xyz_inc", "party_appneuro"],
      clauseIds: ["clause_payment", "clause_ip", "clause_confidentiality", "clause_termination", "clause_liability"],
      templateId: "template_msa",
      version: 2,
      ownerId: "legal_admin",
      locked: false,
      tags: ["partnership", "strategic"],
      metadata: { dealId: "sales_002" },
      createdBy: "legal_admin"
    },
    {
      id: "contract_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "ABC Corp NDA",
      type: "nda",
      status: "signed",
      effectiveDate: pastDate,
      expiryDate: in365Days,
      value: 0,
      currency: "INR",
      partyIds: ["party_abc_corp", "party_appneuro"],
      clauseIds: ["clause_confidentiality"],
      templateId: "template_nda",
      version: 1,
      locked: true,
      tags: ["nda", "confidentiality"],
      metadata: {},
      createdBy: "contract_manager"
    },
    {
      id: "contract_004",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "CloudFirst Infrastructure Services",
      type: "vendor_agreement",
      status: "draft",
      description: "Cloud hosting and infrastructure management services",
      value: 500000,
      currency: "INR",
      partyIds: ["party_vendor_cloud", "party_appneuro"],
      clauseIds: ["clause_payment", "clause_sla"],
      version: 1,
      locked: false,
      tags: ["vendor", "infrastructure", "cloud"],
      metadata: {},
      createdBy: "contract_manager"
    },
    {
      id: "contract_005",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "XYZ Retainer Agreement - Q2 2026",
      type: "retainer_agreement",
      status: "pending_approval",
      description: "Monthly retainer for ongoing consulting services",
      effectiveDate: in30Days,
      expiryDate: in120Days,
      value: 1200000,
      currency: "INR",
      partyIds: ["party_xyz_inc", "party_appneuro"],
      clauseIds: ["clause_payment", "clause_confidentiality", "clause_termination"],
      version: 1,
      ownerId: "legal_admin",
      locked: false,
      tags: ["retainer", "consulting"],
      metadata: { dealId: "sales_003" },
      createdBy: "contract_manager"
    }
  );

  state.versions.push(
    {
      id: "version_001_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_001",
      version: 1,
      content: "Full service agreement content...",
      changes: "Initial draft",
      createdBy: "contract_manager",
      notes: "Initial version from service agreement template",
      status: "finalized"
    },
    {
      id: "version_002_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_002",
      version: 1,
      content: "Partnership agreement v1...",
      changes: "Initial draft",
      createdBy: "legal_admin",
      status: "draft"
    },
    {
      id: "version_002_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_002",
      version: 2,
      content: "Partnership agreement v2 with updated IP terms...",
      changes: "Updated IP and liability clauses per XYZ feedback",
      createdBy: "legal_admin",
      notes: "Incorporated XYZ legal comments",
      status: "finalized"
    }
  );

  state.reviews.push(
    {
      id: "review_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_002",
      reviewType: "legal",
      status: "approved",
      comments: "All legal requirements met. IP terms are standard.",
      reviewedBy: "legal_admin",
      reviewedAt: createdAt,
      createdBy: "legal_admin"
    },
    {
      id: "review_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_005",
      reviewType: "legal",
      status: "in_progress",
      comments: "",
      reviewedBy: "legal_reviewer",
      createdBy: "contract_manager"
    }
  );

  state.approvals.push(
    {
      id: "approval_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_005",
      approvalType: "multi_level",
      approverRole: "legal_admin",
      status: "pending",
      sequence: 1,
      createdBy: "contract_manager"
    },
    {
      id: "approval_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_005",
      approvalType: "multi_level",
      approverRole: "finance_approver",
      status: "pending",
      sequence: 2,
      createdBy: "contract_manager"
    }
  );

  state.negotiations.push({
    id: "negotiation_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    contractId: "contract_002",
    status: "changes_requested",
    redlines: [],
    timeline: [
      { timestamp: pastDate, action: "Contract sent to XYZ", actorId: "legal_admin" },
      { timestamp: createdAt, action: "XYZ requested changes to liability clause", actorId: "party_xyz_inc" }
    ],
    ownerId: "legal_admin",
    createdBy: "legal_admin"
  });

  state.redlines.push(
    {
      id: "redline_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      negotiationId: "negotiation_001",
      originalText: "Total liability shall not exceed INR 5,00,000",
      newText: "Total liability shall not exceed the total fees paid in the preceding 12 months",
      changeType: "modified",
      status: "accepted",
      changedBy: "party_xyz_inc",
      resolvedBy: "legal_admin",
      resolvedAt: createdAt
    },
    {
      id: "redline_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      negotiationId: "negotiation_001",
      originalText: "Either party may terminate with 30 days notice",
      newText: "Either party may terminate with 45 days notice",
      changeType: "modified",
      status: "pending",
      changedBy: "party_xyz_inc"
    }
  );

  state.signatures.push(
    {
      id: "signature_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_003",
      signerPartyId: "party_abc_corp",
      signerName: "Rajesh Kumar",
      signerEmail: "rajesh@abctech.com",
      signerRole: "signer",
      status: "signed",
      signedAt: pastDate,
      signatureData: "base64-signature-abc",
      order: 1,
      createdBy: "contract_manager"
    },
    {
      id: "signature_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_003",
      signerPartyId: "party_appneuro",
      signerName: "Ajay Prajapat",
      signerEmail: "ajay@appneural.com",
      signerRole: "signer",
      status: "signed",
      signedAt: pastDate,
      signatureData: "base64-signature-appneuro",
      order: 2,
      createdBy: "contract_manager"
    }
  );

  state.obligations.push(
    {
      id: "obligation_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_001",
      title: "Deliver MVP by May 31, 2026",
      description: "Complete and deploy MVP with core functionality",
      responsiblePartyId: "party_appneuro",
      sourceClause: "Scope of Work Section 2.1",
      dueDate: "2026-05-31T00:00:00.000Z",
      status: "in_progress",
      riskLevel: "high",
      metadata: {},
      createdBy: "contract_manager"
    },
    {
      id: "obligation_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_001",
      title: "Payment of INR 3,20,000",
      description: "Second milestone payment upon MVP delivery",
      responsiblePartyId: "party_abc_corp",
      dueDate: "2026-06-07T00:00:00.000Z",
      status: "pending",
      riskLevel: "medium",
      metadata: {},
      createdBy: "contract_manager"
    },
    {
      id: "obligation_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_001",
      title: "Submit monthly progress report",
      description: "Provide detailed progress report including hours spent and blockers",
      responsiblePartyId: "party_appneuro",
      sourceClause: "Reporting Section 4.2",
      dueDate: "2026-05-25T00:00:00.000Z",
      status: "completed",
      completedAt: "2026-05-20T14:30:00.000Z",
      evidence: "Report submitted via email to project manager",
      riskLevel: "low",
      metadata: {},
      createdBy: "contract_manager"
    },
    {
      id: "obligation_004",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_001",
      title: "Client to provide API credentials",
      description: "Provide staging API credentials for integration testing",
      responsiblePartyId: "party_abc_corp",
      dueDate: "2026-05-10T00:00:00.000Z",
      status: "overdue",
      riskLevel: "high",
      metadata: {},
      createdBy: "contract_manager"
    }
  );

  state.renewals.push({
    id: "renewal_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    contractId: "contract_001",
    renewalDate: in30Days,
    newExpiryDate: in425Days,
    newValue: 950000,
    status: "pending",
    autoRenew: false,
    renewalTerms: "Price increase of 18.75% for next term",
    createdBy: "contract_manager"
  });

  state.risks.push(
    {
      id: "risk_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_001",
      title: "API credentials not provided on time",
      description: "Client has not provided required API credentials despite multiple reminders",
      category: "other",
      severity: "high",
      status: "open",
      mitigation: "Escalate to client account manager for immediate action",
      ownerId: "contract_manager",
      createdBy: "contract_manager"
    },
    {
      id: "risk_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_002",
      title: "Extended negotiation timeline",
      description: "Negotiation is taking longer than expected due to back-and-forth on liability terms",
      category: "liability",
      severity: "medium",
      status: "open",
      mitigation: "Schedule call with XYZ leadership to expedite decision",
      ownerId: "legal_admin",
      createdBy: "legal_admin"
    },
    {
      id: "risk_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contractId: "contract_004",
      title: "Missing liability cap clause",
      description: "Draft vendor agreement does not include standard liability limitation",
      category: "liability",
      severity: "critical",
      status: "open",
      mitigation: "Add standard liability cap clause before approval",
      ownerId: "legal_admin",
      createdBy: "contract_manager"
    }
  );

  state.events.push(
    {
      id: "event_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "contract.signed",
      source: "ContractOS",
      contractId: "contract_003",
      data: { message: "NDA signed by both parties" }
    },
    {
      id: "event_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "obligation.overdue",
      source: "ContractOS",
      contractId: "contract_001",
      data: { obligationId: "obligation_004", title: "Client to provide API credentials" }
    },
    {
      id: "event_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "contract.expiring",
      source: "ContractOS",
      contractId: "contract_001",
      data: { daysRemaining: 60, action: "initiate_renewal" }
    }
  );

  return state;
}
