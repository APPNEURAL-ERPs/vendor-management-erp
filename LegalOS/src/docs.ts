export function docs() {
  return {
    name: "LegalOS",
    version: "1.0.0",
    description: "Legal cases, IP, privacy, terms, litigation, counsel, and legal operations",
    auth: {
      headers: {
        "x-role": "owner | admin | legal_admin | legal_counsel | paralegal | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      case: "A legal case representing litigation, arbitration, mediation, or corporate matter.",
      matter: "A legal matter grouping related cases and documents.",
      document: "A legal document such as contracts, agreements, policies, notices.",
      contract: "A formal contract with parties, clauses, obligations, and signatures.",
      nda: "Non-disclosure agreement for confidentiality protection.",
      counsel: "Legal counsel or attorney managing cases.",
      invoice: "Legal invoice from counsel for services rendered.",
      hold: "Legal hold for preserving evidence during litigation.",
      dispute: "A dispute tracked from open to resolution.",
      approval: "Approval workflow for contracts and legal documents."
    },
    examples: {
      createCase: {
        method: "POST",
        path: "/legalos/cases",
        headers: { "x-role": "legal_admin" },
        body: {
          caseNumber: "CASE-001",
          title: "Client Contract Dispute",
          caseType: "litigation",
          status: "open",
          priority: "high"
        }
      },
      createContract: {
        method: "POST",
        path: "/legalos/contracts",
        headers: { "x-role": "legal_admin" },
        body: {
          contractNumber: "CTR-001",
          title: "Service Agreement with ABC Corp",
          contractType: "service",
          partyName: "ABC Corp",
          status: "draft"
        }
      },
      generateNDA: {
        method: "POST",
        path: "/legalos/ndas",
        headers: { "x-role": "legal_admin" },
        body: {
          ndaNumber: "NDA-001",
          title: "Mutual NDA for Partnership",
          ndaType: "mutual",
          partyName: "XYZ Inc"
        }
      }
    }
  };
}
