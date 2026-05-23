export function docs() {
  return {
    name: "ResearchOS",
    version: "1.0.0",
    description: "ResearchOS: research questions, studies, sources, notes, hypotheses, evidence, insights, and synthesis for market, competitor, and user research",
    auth: {
      headers: {
        "x-role": "owner | admin | research_admin | researcher | analyst | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      study: "A research project containing questions, sources, and insights for a specific research objective.",
      researchQuestion: "A specific question being investigated within a study, which can have hypotheses and evidence.",
      source: "A data source (website, report, interview, survey) containing information for research.",
      note: "A researcher's notes and observations linked to studies, questions, or sources.",
      hypothesis: "A proposed explanation for a research question, which can be supported or refuted by evidence.",
      evidence: "Data, quotes, or facts from sources that support or refute hypotheses.",
      insight: "A derived understanding or recommendation based on evidence and analysis."
    },
    examples: {
      createStudy: {
        method: "POST",
        path: "/researchos/studies",
        headers: { "x-role": "researcher" },
        body: { name: "AI Resume Builder Market Research", type: "market", description: "Research market opportunity for AI-powered resume tools" }
      },
      addQuestion: {
        method: "POST",
        path: "/researchos/questions",
        headers: { "x-role": "researcher" },
        body: { studyId: "study_xxx", question: "What are the key pain points in current resume building tools?", type: "exploratory", priority: "high" }
      },
      addSource: {
        method: "POST",
        path: "/researchos/sources",
        headers: { "x-role": "researcher" },
        body: { studyId: "study_xxx", title: "Resume.io Review", sourceType: "review", url: "https://trustpilot.com/review/resume.io", reliability: "medium" }
      },
      addEvidence: {
        method: "POST",
        path: "/researchos/evidence",
        headers: { "x-role": "researcher" },
        body: { sourceId: "source_xxx", hypothesisId: "hypothesis_xxx", type: "testimonial", content: "Users complain about lack of ATS feedback", relevance: "high", strength: "moderate" }
      },
      generateInsight: {
        method: "POST",
        path: "/researchos/insights",
        headers: { "x-role": "researcher" },
        body: { studyId: "study_xxx", title: "ATS Feedback Gap", insightType: "opportunity", observation: "Job seekers want ATS compatibility feedback", evidence: ["source_xxx", "evidence_xxx"], impact: "high", confidence: "high" }
      }
    }
  };
}
