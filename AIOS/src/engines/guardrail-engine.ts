import { Guardrail, GuardrailScanResult } from "../core/domain";

export class GuardrailEngine {
  scan(text: string, guardrails: Guardrail[], phase: "input" | "output" = "input"): GuardrailScanResult {
    const violations: GuardrailScanResult["violations"] = [];
    const lower = String(text).toLowerCase();

    for (const guardrail of guardrails.filter((item) => item.status === "active")) {
      if (phase === "input" && guardrail.maxInputLength && text.length > guardrail.maxInputLength) {
        violations.push({ guardrailId: guardrail.id, guardrailKey: guardrail.key, reason: `Input exceeds max length ${guardrail.maxInputLength}` });
      }
      if (phase === "output" && guardrail.maxOutputLength && text.length > guardrail.maxOutputLength) {
        violations.push({ guardrailId: guardrail.id, guardrailKey: guardrail.key, reason: `Output exceeds max length ${guardrail.maxOutputLength}` });
      }
      for (const term of guardrail.bannedTerms) {
        if (term && lower.includes(term.toLowerCase())) {
          violations.push({ guardrailId: guardrail.id, guardrailKey: guardrail.key, reason: `Banned term detected: ${term}` });
        }
      }
      for (const term of guardrail.requiredTerms) {
        if (term && !lower.includes(term.toLowerCase())) {
          violations.push({ guardrailId: guardrail.id, guardrailKey: guardrail.key, reason: `Required term missing: ${term}` });
        }
      }
      if (phase === "output" && guardrail.requireCitations && !/citations?:/i.test(text)) {
        violations.push({ guardrailId: guardrail.id, guardrailKey: guardrail.key, reason: "Citations are required" });
      }
    }

    return { allowed: violations.length === 0, violations };
  }
}
