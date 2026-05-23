export function docs() {
  return {
    name: "DocumentOS",
    version: "1.0.0",
    description: "DocumentOS: document generation, templates, PDFs, proposals, contracts, invoices, certificates, reports, and document workflows.",
    auth: {
      headers: {
        "x-role": "owner | admin | document_admin | document_editor | document_approver | document_viewer | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      document: "A structured document with content, sections, fields, and metadata. Can be an invoice, proposal, contract, certificate, resume, report, policy, SOP, or custom type.",
      template: "A reusable document blueprint with placeholders and variables for merge operations.",
      version: "A snapshot of a document at a specific point in time for tracking changes.",
      pdfRender: "A PDF export job with formatting, branding, watermarks, and styling.",
      approval: "A multi-step review and approval workflow for documents.",
      signature: "An e-signature request with signers, signature fields, and audit trail.",
      shareLink: "A secure, optionally expiring link for sharing documents with external users."
    },
    documentTypes: [
      "invoice",
      "quotation",
      "proposal",
      "contract",
      "agreement",
      "certificate",
      "resume",
      "report",
      "policy",
      "sop",
      "offer_letter",
      "receipt",
      "badge",
      "id_card",
      "custom"
    ],
    documentStatuses: [
      "draft",
      "review",
      "approved",
      "published",
      "signed",
      "archived",
      "deprecated",
      "rolled_back"
    ],
    examples: {
      createDocument: {
        method: "POST",
        path: "/documentos/documents",
        headers: { "x-role": "document_admin" },
        body: {
          name: "Q1 2026 Invoice for ABC Technologies",
          type: "invoice",
          title: "Invoice INV-202601-0001",
          content: "Thank you for your business. Please find the invoice details below.",
          fields: [
            { key: "client_name", value: "ABC Technologies", type: "text", required: true, metadata: {} },
            { key: "amount", value: "25000", type: "currency", required: true, metadata: {} },
            { key: "due_date", value: "2026-02-28", type: "date", required: true, metadata: {} }
          ],
          metadata: { tags: ["finance", "q1-2026", "abc-tech"] }
        }
      },
      createProposal: {
        method: "POST",
        path: "/documentos/documents",
        headers: { "x-role": "document_admin" },
        body: {
          name: "AI Automation Proposal for ABC Technologies",
          type: "proposal",
          title: "AI Automation Services Proposal",
          content: "We propose to implement AI automation solutions for your organization.",
          templateId: "tpl_proposal_default"
        }
      },
      mergeTemplate: {
        method: "POST",
        path: "/documentos/documents/doc_invoice_abc/merge",
        headers: { "x-role": "document_editor" },
        body: {
          templateId: "tpl_invoice_gst",
          variables: {
            client_name: "ABC Technologies",
            invoice_amount: "₹25,000",
            due_date: "31 May 2026",
            gstin: "27AABCU9603R1ZM"
          }
        }
      },
      exportPDF: {
        method: "POST",
        path: "/documentos/documents/doc_proposal_abc/export/pdf",
        headers: { "x-role": "document_editor" },
        body: {
          config: {
            pageSize: "A4",
            orientation: "portrait",
            watermark: { text: "DRAFT", opacity: 0.3 },
            branding: { logo: "company-logo.png", colors: { primary: "#0066cc" } }
          }
        }
      },
      createApproval: {
        method: "POST",
        path: "/documentos/documents/doc_contract_abc/approvals",
        headers: { "x-role": "document_admin" },
        body: {
          approvers: [
            { id: "user_manager_001", name: "John Manager", email: "john@example.com", role: "manager", order: 1 },
            { id: "user_legal_001", name: "Jane Legal", email: "jane@example.com", role: "legal", order: 2 }
          ]
        }
      },
      createSignature: {
        method: "POST",
        path: "/documentos/documents/doc_contract_abc/signatures",
        headers: { "x-role": "document_admin" },
        body: {
          signers: [
            { id: "user_client_001", name: "Client Signer", email: "client@example.com", order: 1 }
          ],
          config: {
            orderedSigning: true,
            message: "Please review and sign the attached contract agreement.",
            expirationDays: 30
          }
        }
      },
      searchDocuments: {
        method: "GET",
        path: "/documentos/documents/search?q=ABC Technologies&type=invoice",
        headers: { "x-role": "document_viewer" }
      }
    }
  };
}
