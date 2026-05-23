import { DocumentState, Document, DocumentTemplate, DocumentSection } from "./types";
import { emptyState } from "./core/datastore";
import { nowIso, newId, generateInvoiceNumber, generateCertificateId } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): DocumentState {
  const state = emptyState();
  const createdAt = nowIso();

  state.templates.push(
    {
      id: "tpl_invoice_default",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice_default",
      name: "Standard Invoice Template",
      description: "A professional invoice template with GST support",
      type: "invoice",
      status: "active",
      category: "Finance",
      tags: ["invoice", "gst", "finance"],
      content: `INVOICE
Invoice Number: {{invoice_number}}
Date: {{invoice_date}}
Due Date: {{due_date}}

BILL TO:
{{client_name}}
{{client_address}}
GSTIN: {{client_gstin}}

ITEMS:
{{line_items}}

Subtotal: {{subtotal}}
GST ({{gst_rate}}%): {{gst_amount}}
Total: {{total_amount}}
Due Date: {{due_date}}

Payment Terms: {{payment_terms}}
Payment Link: {{payment_link}}

Thank you for your business!`,
      sections: [
        {
          id: "sec_header",
          title: "Header",
          content: "INVOICE",
          order: 1,
          variables: { invoice_number: "", invoice_date: "" },
          metadata: {}
        },
        {
          id: "sec_client",
          title: "Client Information",
          content: "BILL TO:\n{{client_name}}\n{{client_address}}",
          order: 2,
          variables: { client_name: "", client_address: "", client_gstin: "" },
          metadata: {}
        },
        {
          id: "sec_items",
          title: "Line Items",
          content: "{{line_items}}",
          order: 3,
          variables: { line_items: "", subtotal: "", gst_rate: "", gst_amount: "", total_amount: "" },
          metadata: {}
        },
        {
          id: "sec_payment",
          title: "Payment",
          content: "Payment Terms: {{payment_terms}}\nPayment Link: {{payment_link}}",
          order: 4,
          variables: { payment_terms: "", payment_link: "" },
          metadata: {}
        }
      ],
      variables: [
        { key: "invoice_number", value: "", type: "text", source: "template" },
        { key: "invoice_date", value: "", type: "date", source: "template" },
        { key: "client_name", value: "", type: "text", source: "template" },
        { key: "client_address", value: "", type: "text", source: "template" },
        { key: "client_gstin", value: "", type: "text", source: "template" },
        { key: "subtotal", value: 0, type: "currency", source: "template" },
        { key: "gst_rate", value: 18, type: "number", source: "template" },
        { key: "gst_amount", value: 0, type: "currency", source: "calculated" },
        { key: "total_amount", value: 0, type: "currency", source: "calculated" }
      ],
      metadata: { version: 1, author: "DocumentOS" },
      version: 1,
      usageCount: 24,
      lastUsedAt: createdAt,
      createdBy: "seed"
    },
    {
      id: "tpl_proposal_default",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "proposal_default",
      name: "Business Proposal Template",
      description: "A comprehensive business proposal template with sections for problem, solution, scope, and pricing",
      type: "proposal",
      status: "active",
      category: "Sales",
      tags: ["proposal", "sales", "business"],
      content: `PROPOSAL
{{proposal_title}}

Client: {{client_name}}
Date: {{proposal_date}}
Proposal Number: {{proposal_number}}

1. EXECUTIVE SUMMARY
{{executive_summary}}

2. CLIENT PROBLEM
{{client_problem}}

3. PROPOSED SOLUTION
{{proposed_solution}}

4. SCOPE OF WORK
{{scope_of_work}}

5. DELIVERABLES
{{deliverables}}

6. TIMELINE
{{timeline}}

7. INVESTMENT
{{pricing}}

8. TERMS AND CONDITIONS
{{terms}}

9. NEXT STEPS
{{next_steps}}

Signatures:
Client: _____________ Date: _____
Provider: _____________ Date: _____`,
      sections: [
        {
          id: "sec_exec_summary",
          title: "Executive Summary",
          content: "{{executive_summary}}",
          order: 1,
          variables: { proposal_title: "", client_name: "", proposal_date: "" },
          metadata: {}
        },
        {
          id: "sec_problem",
          title: "Client Problem",
          content: "{{client_problem}}",
          order: 2,
          variables: { client_problem: "" },
          metadata: {}
        },
        {
          id: "sec_solution",
          title: "Proposed Solution",
          content: "{{proposed_solution}}",
          order: 3,
          variables: { proposed_solution: "" },
          metadata: {}
        },
        {
          id: "sec_scope",
          title: "Scope of Work",
          content: "{{scope_of_work}}",
          order: 4,
          variables: { scope_of_work: "" },
          metadata: {}
        },
        {
          id: "sec_pricing",
          title: "Investment",
          content: "{{pricing}}",
          order: 7,
          variables: { pricing: "", total_amount: "" },
          metadata: {}
        }
      ],
      variables: [
        { key: "proposal_title", value: "", type: "text", source: "template" },
        { key: "client_name", value: "", type: "text", source: "template" },
        { key: "proposal_date", value: "", type: "date", source: "template" },
        { key: "executive_summary", value: "", type: "text", source: "template" },
        { key: "client_problem", value: "", type: "text", source: "template" },
        { key: "proposed_solution", value: "", type: "text", source: "template" },
        { key: "scope_of_work", value: "", type: "text", source: "template" },
        { key: "pricing", value: "", type: "text", source: "template" }
      ],
      metadata: { version: 1, author: "DocumentOS" },
      version: 1,
      usageCount: 18,
      lastUsedAt: createdAt,
      createdBy: "seed"
    },
    {
      id: "tpl_certificate_default",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "certificate_default",
      name: "Course Completion Certificate",
      description: "Professional certificate template for course completion",
      type: "certificate",
      status: "active",
      category: "Learning",
      tags: ["certificate", "course", "completion"],
      content: `CERTIFICATE OF COMPLETION

{{certificate_title}}

This is to certify that

{{recipient_name}}

has successfully completed

{{course_name}}

on {{completion_date}}

Certificate ID: {{certificate_id}}
Date Issued: {{issue_date}}

_____________________
{{issuer_name}}
{{issuer_title}}`,
      sections: [
        {
          id: "sec_cert_title",
          title: "Certificate Title",
          content: "{{certificate_title}}",
          order: 1,
          variables: { certificate_title: "" },
          metadata: {}
        },
        {
          id: "sec_recipient",
          title: "Recipient Information",
          content: "This is to certify that\n\n{{recipient_name}}\n\nhas successfully completed\n\n{{course_name}}",
          order: 2,
          variables: { recipient_name: "", course_name: "", completion_date: "" },
          metadata: {}
        },
        {
          id: "sec_signature",
          title: "Signature",
          content: "_____________________\n{{issuer_name}}\n{{issuer_title}}",
          order: 3,
          variables: { issuer_name: "", issuer_title: "" },
          metadata: {}
        }
      ],
      variables: [
        { key: "certificate_title", value: "Certificate of Completion", type: "text", source: "template" },
        { key: "recipient_name", value: "", type: "text", source: "template" },
        { key: "course_name", value: "", type: "text", source: "template" },
        { key: "completion_date", value: "", type: "date", source: "template" },
        { key: "certificate_id", value: "", type: "text", source: "template" },
        { key: "issuer_name", value: "", type: "text", source: "template" },
        { key: "issuer_title", value: "", type: "text", source: "template" }
      ],
      metadata: { version: 1, author: "DocumentOS" },
      version: 1,
      usageCount: 156,
      lastUsedAt: createdAt,
      createdBy: "seed"
    },
    {
      id: "tpl_contract_nda",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "contract_nda",
      name: "Non-Disclosure Agreement",
      description: "Standard NDA template for protecting confidential information",
      type: "contract",
      status: "active",
      category: "Legal",
      tags: ["contract", "nda", "legal", "confidential"],
      content: `NON-DISCLOSURE AGREEMENT

This Agreement is entered into as of {{agreement_date}} by and between:

Party A: {{party_a_name}}
Address: {{party_a_address}}

and

Party B: {{party_b_name}}
Address: {{party_b_address}}

1. DEFINITION OF CONFIDENTIAL INFORMATION
{{confidential_definition}}

2. OBLIGATIONS
{{obligations}}

3. TERM
This agreement shall remain in effect for {{term_years}} years from the date of signing.

4. GOVERNING LAW
This agreement shall be governed by the laws of {{governing_law}}.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

Party A: _____________ Date: _____
Party B: _____________ Date: _____`,
      sections: [
        {
          id: "sec_parties",
          title: "Parties",
          content: "Party A: {{party_a_name}}\nParty B: {{party_b_name}}",
          order: 1,
          variables: { party_a_name: "", party_b_name: "", agreement_date: "" },
          metadata: {}
        },
        {
          id: "sec_confidential",
          title: "Confidential Information",
          content: "{{confidential_definition}}",
          order: 2,
          variables: { confidential_definition: "" },
          metadata: {}
        },
        {
          id: "sec_obligations",
          title: "Obligations",
          content: "{{obligations}}",
          order: 3,
          variables: { obligations: "" },
          metadata: {}
        }
      ],
      variables: [
        { key: "agreement_date", value: "", type: "date", source: "template" },
        { key: "party_a_name", value: "", type: "text", source: "template" },
        { key: "party_b_name", value: "", type: "text", source: "template" },
        { key: "confidential_definition", value: "", type: "text", source: "template" },
        { key: "obligations", value: "", type: "text", source: "template" },
        { key: "term_years", value: "2", type: "number", source: "template" },
        { key: "governing_law", value: "India", type: "text", source: "template" }
      ],
      metadata: { version: 1, author: "DocumentOS" },
      version: 1,
      usageCount: 42,
      lastUsedAt: createdAt,
      createdBy: "seed"
    }
  );

  state.documents.push(
    {
      id: "doc_invoice_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice_demo_abc",
      name: "Invoice for ABC Technologies - January 2026",
      type: "invoice",
      status: "draft",
      title: "Invoice INV-202601-0001",
      content: "Professional Services Invoice for AI Automation Implementation",
      sections: [],
      fields: [
        { key: "invoice_number", value: "INV-202601-0001", type: "text", required: true, metadata: {} },
        { key: "client_name", value: "ABC Technologies Pvt Ltd", type: "text", required: true, metadata: {} },
        { key: "client_address", value: "123 Tech Park, Bangalore, Karnataka 560001", type: "text", required: true, metadata: {} },
        { key: "client_gstin", value: "29AABCU9603R1ZM", type: "text", required: true, metadata: {} },
        { key: "subtotal", value: "25000", type: "currency", required: true, metadata: {} },
        { key: "gst_rate", value: "18", type: "number", required: true, metadata: {} },
        { key: "gst_amount", value: "4500", type: "currency", required: true, metadata: {} },
        { key: "total_amount", value: "29500", type: "currency", required: true, metadata: {} },
        { key: "due_date", value: "2026-02-28", type: "date", required: true, metadata: {} }
      ],
      variables: [
        { key: "invoice_number", value: "INV-202601-0001", type: "text", source: "system" },
        { key: "client_name", value: "ABC Technologies Pvt Ltd", type: "text", source: "user" },
        { key: "amount", value: "₹29,500", type: "currency", source: "calculated" }
      ],
      metadata: {
        id: "meta_invoice_demo",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        title: "Invoice INV-202601-0001",
        tags: ["finance", "invoice", "abc-tech", "q1-2026"],
        category: "Finance",
        language: "en",
        customFields: {}
      },
      exportedFormats: [],
      accessLevel: "private",
      createdBy: "seed"
    },
    {
      id: "doc_proposal_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "proposal_demo_xyz",
      name: "AI Automation Proposal for XYZ Corporation",
      type: "proposal",
      status: "review",
      templateId: "tpl_proposal_default",
      title: "AI Automation Services Proposal",
      content: "Comprehensive proposal for implementing AI automation across XYZ Corporation operations",
      sections: [],
      fields: [
        { key: "proposal_number", value: "PROP-2026-001", type: "text", required: true, metadata: {} },
        { key: "client_name", value: "XYZ Corporation", type: "text", required: true, metadata: {} },
        { key: "executive_summary", value: "We propose to implement AI automation solutions that will reduce operational costs by 30% and improve efficiency.", type: "text", required: true, metadata: {} },
        { key: "total_amount", value: "₹5,00,000", type: "currency", required: true, metadata: {} }
      ],
      variables: [
        { key: "proposal_title", value: "AI Automation Services Proposal", type: "text", source: "template" },
        { key: "client_name", value: "XYZ Corporation", type: "text", source: "user" },
        { key: "proposal_date", value: "2026-01-15", type: "date", source: "system" }
      ],
      metadata: {
        id: "meta_proposal_demo",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        title: "AI Automation Services Proposal",
        tags: ["sales", "proposal", "xyz-corp", "ai-automation"],
        category: "Sales",
        language: "en",
        customFields: {}
      },
      exportedFormats: [],
      accessLevel: "tenant",
      createdBy: "seed"
    },
    {
      id: "doc_certificate_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "certificate_demo_ai101",
      name: "AI Fundamentals Course Completion Certificate",
      type: "certificate",
      status: "approved",
      templateId: "tpl_certificate_default",
      title: "Certificate of Completion - AI Fundamentals",
      content: "Certificate awarded for successful completion of AI Fundamentals training program",
      sections: [],
      fields: [
        { key: "certificate_id", value: "CERT-2026-001", type: "text", required: true, metadata: {} },
        { key: "recipient_name", value: "John Doe", type: "text", required: true, metadata: {} },
        { key: "course_name", value: "AI Fundamentals", type: "text", required: true, metadata: {} },
        { key: "completion_date", value: "2026-01-10", type: "date", required: true, metadata: {} },
        { key: "issuer_name", value: "Jane Smith", type: "text", required: true, metadata: {} },
        { key: "issuer_title", value: "Training Director", type: "text", required: true, metadata: {} }
      ],
      variables: [
        { key: "recipient_name", value: "John Doe", type: "text", source: "user" },
        { key: "course_name", value: "AI Fundamentals", type: "text", source: "system" },
        { key: "completion_date", value: "10 January 2026", type: "date", source: "system" }
      ],
      metadata: {
        id: "meta_certificate_demo",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        title: "Certificate of Completion - AI Fundamentals",
        tags: ["certificate", "course", "ai-fundamentals", "john-doe"],
        category: "Learning",
        language: "en",
        customFields: { recipient_email: "john.doe@example.com", score: "92%" }
      },
      exportedFormats: ["pdf"],
      accessLevel: "shared",
      watermark: "CERTIFIED",
      verificationUrl: "https://verify.appneural.com/cert/CERT-2026-001",
      createdBy: "seed"
    },
    {
      id: "doc_contract_nda_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "contract_nda_demo_abc",
      name: "NDA between APPNEURAL and ABC Technologies",
      type: "contract",
      status: "approved",
      templateId: "tpl_contract_nda",
      title: "Non-Disclosure Agreement",
      content: "Mutual non-disclosure agreement for protecting confidential business information",
      sections: [],
      fields: [
        { key: "agreement_date", value: "2026-01-05", type: "date", required: true, metadata: {} },
        { key: "party_a_name", value: "APPNEURAL Solutions Pvt Ltd", type: "text", required: true, metadata: {} },
        { key: "party_b_name", value: "ABC Technologies Pvt Ltd", type: "text", required: true, metadata: {} },
        { key: "term_years", value: "2", type: "number", required: true, metadata: {} },
        { key: "governing_law", value: "India", type: "text", required: true, metadata: {} }
      ],
      variables: [
        { key: "party_a_name", value: "APPNEURAL Solutions Pvt Ltd", type: "text", source: "system" },
        { key: "party_b_name", value: "ABC Technologies Pvt Ltd", type: "text", source: "user" }
      ],
      metadata: {
        id: "meta_contract_nda_demo",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        title: "Non-Disclosure Agreement",
        tags: ["contract", "nda", "abc-tech", "legal"],
        category: "Legal",
        language: "en",
        customFields: {}
      },
      exportedFormats: [],
      accessLevel: "private",
      createdBy: "seed"
    }
  );

  state.versions.push(
    {
      id: "ver_proposal_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      documentId: "doc_proposal_demo",
      version: 1,
      name: "Initial Draft",
      content: "Initial proposal draft for XYZ Corporation",
      sections: [],
      fields: {
        proposal_number: "PROP-2026-001",
        client_name: "XYZ Corporation",
        total_amount: "₹5,00,000"
      },
      status: "draft",
      createdBy: "seed",
      notes: "Initial version",
      changeDescription: "Created initial proposal draft"
    }
  );

  state.approvals.push({
    id: "apr_proposal_demo",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    documentId: "doc_proposal_demo",
    versionId: "ver_proposal_1",
    approvers: [
      {
        id: "user_sales_manager",
        name: "Sales Manager",
        email: "sales.manager@appneural.com",
        role: "manager",
        order: 1,
        status: "approved",
        approvedAt: createdAt,
        notes: "Looks good"
      },
      {
        id: "user_finance_director",
        name: "Finance Director",
        email: "finance@appneural.com",
        role: "finance",
        order: 2,
        status: "pending"
      }
    ],
    status: "pending",
    currentStep: 2,
    approvalType: "sequential",
    createdBy: "seed"
  });

  state.signatureRequests.push({
    id: "sig_nda_demo",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    documentId: "doc_contract_nda_demo",
    versionId: "ver_proposal_1",
    signers: [
      {
        id: "user_appneuro_ceo",
        name: "CEO APPNEURAL",
        email: "ceo@appneural.com",
        order: 1,
        status: "signed",
        signedAt: createdAt
      },
      {
        id: "user_abc_legal",
        name: "Legal Representative ABC",
        email: "legal@abc-tech.com",
        order: 2,
        status: "sent"
      }
    ],
    signatureFields: [
      {
        id: "sf_1",
        signerId: "user_appneuro_ceo",
        type: "signature",
        page: 1,
        x: 100,
        y: 600,
        width: 200,
        height: 50,
        required: true,
        status: "signed",
        signedAt: createdAt
      },
      {
        id: "sf_2",
        signerId: "user_abc_legal",
        type: "signature",
        page: 1,
        x: 400,
        y: 600,
        width: 200,
        height: 50,
        required: true,
        status: "draft"
      }
    ],
    status: "sent",
    orderedSigning: true,
    message: "Please review and sign the NDA agreement.",
    expirationDays: 30,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    accessLogs: [
      {
        signerId: "user_appneuro_ceo",
        action: "sent",
        timestamp: createdAt
      },
      {
        signerId: "user_appneuro_ceo",
        action: "signed",
        timestamp: createdAt
      },
      {
        signerId: "user_abc_legal",
        action: "sent",
        timestamp: createdAt
      }
    ],
    createdBy: "seed"
  });

  state.accessLogs.push(
    {
      id: "log_access_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      documentId: "doc_invoice_demo",
      action: "create",
      userId: "seed",
      metadata: { source: "seed" }
    },
    {
      id: "log_access_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      documentId: "doc_proposal_demo",
      action: "view",
      userId: "user_sales_manager",
      metadata: { duration: "5m" }
    },
    {
      id: "log_access_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      documentId: "doc_certificate_demo",
      action: "download",
      userId: "user_john_doe",
      metadata: { format: "pdf" }
    }
  );

  state.pdfRenders.push(
    {
      id: "pdf_cert_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      documentId: "doc_certificate_demo",
      status: "completed",
      format: "pdf",
      filePath: "documents/doc_certificate_demo/pdf_cert_demo.pdf",
      fileSize: 245000,
      pageCount: 1,
      renderedAt: createdAt,
      config: {
        pageSize: "A4",
        orientation: "landscape",
        watermark: { text: "CERTIFIED", opacity: 0.2 },
        branding: { logo: "company-logo.png" }
      },
      createdBy: "seed"
    }
  );

  state.auditLogs.push(
    {
      id: "audit_doc_create",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      documentId: "doc_invoice_demo",
      actorId: "seed",
      action: "create",
      metadata: { name: "Invoice for ABC Technologies" }
    },
    {
      id: "audit_doc_approve",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      documentId: "doc_certificate_demo",
      actorId: "user_training_director",
      action: "approve",
      metadata: { notes: "Approved certificate" }
    }
  );

  return state;
}
