import { LegalState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, plusDays } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): LegalState {
  const state = emptyState();
  const createdAt = nowIso();

  state.counsel.push({
    id: "counsel_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    counselNumber: "COUNSEL-001",
    name: "Jane Smith",
    email: "jane.smith@lawfirm.com",
    phone: "+1-555-0101",
    firm: "Smith & Associates",
    barNumber: "BAR-12345",
    jurisdiction: "California",
    specialties: ["corporate", "contracts", "ip"],
    status: "active",
    hourlyRate: 450,
    caseIds: [],
    matterIds: [],
    notes: "Senior counsel specializing in corporate law",
    metadata: {}
  });

  state.matters.push({
    id: "matter_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    matterNumber: "MATTER-001",
    title: "ABC Corp Engagement",
    description: "General corporate legal matters for ABC Corp client",
    matterType: "corporate",
    status: "active",
    priority: "medium",
    clientName: "ABC Corp",
    clientContact: "contact@abccorp.com",
    assignedCounselId: "counsel_1",
    caseIds: [],
    startDate: createdAt,
    tags: ["client", "corporate"],
    metadata: {}
  });

  state.cases.push({
    id: "case_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    caseNumber: "CASE-2024-001",
    title: "ABC Corp Contract Dispute",
    description: "Contract dispute regarding delivery terms",
    caseType: "litigation",
    status: "active",
    priority: "high",
    court: "Superior Court of California",
    judge: "Hon. John Davis",
    matterId: "matter_1",
    assignedCounselId: "counsel_1",
    budget: 50000,
    spend: 12500,
    openedAt: createdAt,
    nextHearing: plusDays(30),
    tags: ["contract", "dispute", "urgent"],
    metadata: {}
  });

  state.contracts.push({
    id: "contract_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    contractNumber: "CTR-001",
    title: "Service Agreement with ABC Corp",
    contractType: "service",
    status: "active",
    partyName: "ABC Corp",
    partyEmail: "legal@abccorp.com",
    value: 150000,
    currency: "USD",
    startDate: createdAt,
    endDate: plusDays(365),
    renewalDate: plusDays(330),
    paymentTerms: "Net 30",
    autoRenew: true,
    matterId: "matter_1",
    assignedCounselId: "counsel_1",
    clauses: [
      {
        id: "clause_1",
        title: "Confidentiality",
        text: "Both parties agree to maintain confidentiality of all shared information.",
        category: "confidentiality",
        riskLevel: "low",
        isRequired: true
      },
      {
        id: "clause_2",
        title: "Termination",
        text: "Either party may terminate with 30 days written notice.",
        category: "termination",
        riskLevel: "low",
        isRequired: true
      }
    ],
    obligations: [],
    risks: [],
    signatures: [],
    tags: ["service", "client"],
    metadata: {}
  });

  state.ndas.push({
    id: "nda_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    ndaNumber: "NDA-001",
    title: "Mutual NDA with XYZ Inc",
    ndaType: "mutual",
    status: "signed",
    partyName: "XYZ Inc",
    partyEmail: "legal@xyzinc.com",
    purpose: "Discuss potential partnership",
    effectiveDate: createdAt,
    expirationDate: plusDays(730),
    autoRenew: false,
    matterId: "matter_1",
    signatures: [],
    signedAt: createdAt,
    scope: "All business discussions and materials shared",
    tags: ["nda", "partnership"],
    metadata: {}
  });

  state.documents.push({
    id: "doc_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    title: "Service Agreement - ABC Corp",
    documentType: "contract",
    status: "active",
    caseId: "case_1",
    matterId: "matter_1",
    contractId: "contract_1",
    party: "ABC Corp",
    version: 1,
    approvedBy: "counsel_1",
    approvedAt: createdAt,
    signedAt: createdAt,
    tags: ["contract", "signed"],
    metadata: {}
  });

  state.invoices.push({
    id: "invoice_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    invoiceNumber: "INV-001",
    counselId: "counsel_1",
    caseId: "case_1",
    matterId: "matter_1",
    description: "Legal services for CASE-2024-001",
    invoiceDate: createdAt,
    dueDate: plusDays(30),
    amount: 4500,
    currency: "USD",
    status: "pending",
    lineItems: [
      { description: "Contract review and analysis", hours: 6, rate: 450, amount: 2700, date: createdAt },
      { description: "Client meeting", hours: 4, rate: 450, amount: 1800, date: createdAt }
    ],
    notes: "Invoice for initial contract dispute work",
    metadata: {}
  });

  state.holds.push({
    id: "hold_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    holdNumber: "HOLD-001",
    title: "Evidence Preservation for Case 001",
    description: "Legal hold on all emails and documents related to the contract dispute",
    caseId: "case_1",
    status: "active",
    holdType: "litigation",
    custodianIds: [],
    dataSources: ["email", "file_server", "database"],
    scope: "All communications regarding ABC Corp contract",
    startDate: createdAt,
    notes: "Preserve all relevant evidence"
  });

  state.templates.push({
    id: "template_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "service_agreement",
    name: "Standard Service Agreement",
    description: "Template for service agreements with clients",
    templateType: "contract",
    category: "service",
    content: "This Service Agreement ('Agreement') is entered into between {{partyName}} and {{ourCompany}}...",
    variables: [
      { name: "partyName", label: "Party Name", type: "string", required: true },
      { name: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { name: "term", label: "Term (months)", type: "number", required: true, defaultValue: 12 }
    ],
    status: "active",
    version: 1,
    tags: ["contract", "service", "template"],
    metadata: {}
  });

  state.notices.push({
    id: "notice_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    noticeNumber: "NOTICE-001",
    title: "Payment Reminder - INV-001",
    noticeType: "payment",
    status: "sent",
    recipientName: "Finance Department",
    recipientEmail: "finance@abccorp.com",
    subject: "Payment Reminder - Invoice INV-001",
    caseId: "case_1",
    matterId: "matter_1",
    sentAt: createdAt,
    tags: ["payment", "reminder"],
    metadata: {}
  });

  state.disputes.push({
    id: "dispute_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    disputeNumber: "DISPUTE-001",
    title: "Delivery Timeline Dispute",
    description: "Dispute regarding delivery timeline for project deliverables",
    disputeType: "delivery",
    status: "negotiating",
    severity: "medium",
    caseId: "case_1",
    matterId: "matter_1",
    contractId: "contract_1",
    partyName: "ABC Corp",
    partyContact: "pm@abccorp.com",
    amount: 15000,
    currency: "USD",
    openedAt: createdAt,
    assignedCounselId: "counsel_1",
    timeline: [
      { date: createdAt, action: "Dispute opened", description: "Client raised delivery timeline concerns" }
    ],
    tags: ["dispute", "delivery"],
    metadata: {}
  });

  state.ipAssets.push({
    id: "ipasset_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    assetNumber: "IP-001",
    name: "APPNEURAL Logo",
    assetType: "trademark",
    status: "registered",
    registrationNumber: "TM-123456",
    jurisdiction: "United States",
    owner: "APPNEURAL",
    description: "Company logo and branding trademark",
    caseIds: [],
    renewalDate: plusDays(1825),
    tags: ["trademark", "brand", "logo"],
    metadata: {}
  });

  state.approvals.push({
    id: "approval_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    requestNumber: "APR-001",
    requestType: "contract",
    title: "Approve Service Agreement with ABC Corp",
    description: "Contract value: $150,000",
    status: "pending",
    requestorId: "counsel_1",
    caseId: "case_1",
    matterId: "matter_1",
    contractId: "contract_1",
    priority: "high",
    dueDate: plusDays(5),
    comments: []
  });

  state.events.push({
    id: "event_seed",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "legalos.seeded",
    source: "LegalOS",
    data: { message: "LegalOS demo data seeded" }
  });

  return state;
}
