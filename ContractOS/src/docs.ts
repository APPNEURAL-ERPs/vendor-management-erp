export function docs() {
  return {
    name: "ContractOS",
    version: "1.0.0",
    description: "Contract lifecycle management: agreements, clauses, signatures, negotiations, obligations, amendments, and compliance tracking",
    auth: {
      headers: {
        "x-role": "owner | admin | legal_admin | contract_manager | legal_reviewer | finance_approver | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      contract: "A legal agreement between parties with lifecycle states from draft to expiration.",
      clause: "A reusable legal clause that can be included in contracts.",
      template: "A pre-defined contract format with clauses and structure.",
      party: "A participant in a contract (client, vendor, partner, etc.).",
      signature: "An e-signature record tracking execution status.",
      negotiation: "Redline tracking and negotiation status between parties.",
      obligation: "A commitment or deliverable tracked against a contract.",
      amendment: "A modification to an active contract with approval workflow.",
      renewal: "Contract renewal tracking with terms and pricing updates.",
      risk: "Identified risks in contract terms requiring attention."
    },
    examples: {
      createContract: {
        method: "POST",
        path: "/contractos/contracts",
        headers: { "x-role": "contract_manager" },
        body: {
          title: "Website Development Service Agreement",
          type: "service_agreement",
          description: "Full-stack website development for ABC Corp",
          value: 800000,
          currency: "INR",
          partyIds: ["party_abc_corp"],
          clauseIds: ["clause_payment", "clause_ip"]
        }
      },
      approveContract: {
        method: "POST",
        path: "/contractos/contracts/:id/approve",
        headers: { "x-role": "legal_reviewer" },
        body: { comments: "Approved after legal review" }
      },
      signContract: {
        method: "POST",
        path: "/contractos/contracts/:id/sign",
        headers: { "x-role": "contract_manager" },
        body: { signatureData: "base64-signature-data" }
      },
      trackObligation: {
        method: "POST",
        path: "/contractos/contracts/:id/obligations",
        headers: { "x-role": "contract_manager" },
        body: {
          title: "Deliver MVP by Q2",
          dueDate: "2026-06-30T00:00:00.000Z",
          responsiblePartyId: "party_appneuro",
          riskLevel: "high"
        }
      }
    },
    lifecycle: {
      stages: [
        "draft",
        "internal_review",
        "legal_review",
        "client_review",
        "negotiation",
        "pending_approval",
        "approved",
        "ready_for_signature",
        "sent_for_signature",
        "partially_signed",
        "signed",
        "active",
        "expired",
        "terminated",
        "renewed",
        "amended",
        "archived"
      ]
    }
  };
}
