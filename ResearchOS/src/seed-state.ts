import { ResearchState } from "./domain";
import { nowIso } from "./core/id";
import { emptyState } from "./core/datastore";

export function createSeedState(tenantId = "demo-tenant"): ResearchState {
  const state = emptyState();
  const createdAt = nowIso();

  state.studies.push({
    id: "study_ai_resume_market",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "ai_resume_market",
    name: "AI Resume Builder Market Research",
    description: "Research market opportunity for AI-powered resume tools targeting job seekers and recruiters",
    type: "market",
    status: "in_progress",
    tags: ["ai", "resume", "job-seekers", "career"],
    questionIds: ["question_pain_points", "question_competitors", "question_pricing"],
    sourceIds: ["source_resume_io", "source_enhancv"],
    insightIds: ["insight_ats_feedback"],
    ownerId: "user_researcher",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { targetMarket: "Global", estimatedSize: "10B USD" }
  });

  state.studies.push({
    id: "study_competitor_analysis",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "resume_competitor",
    name: "Resume Builder Competitor Analysis",
    description: "Analyze top resume builder competitors to find differentiation opportunities",
    type: "competitor",
    status: "in_progress",
    tags: ["competitors", "resume", "analysis"],
    questionIds: ["question_competitor_features"],
    sourceIds: ["source_resume_io", "source_enhancv", "source_kickresume"],
    insightIds: ["insight_differentiation"],
    ownerId: "user_researcher",
    metadata: {}
  });

  state.questions.push(
    {
      id: "question_pain_points",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_ai_resume_market",
      question: "What are the key pain points in current resume building tools?",
      type: "exploratory",
      status: "answered",
      hypothesisIds: ["hypothesis_ats_feedback"],
      evidenceIds: ["evidence_ats_complaint"],
      priority: "high",
      metadata: {}
    },
    {
      id: "question_competitors",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_ai_resume_market",
      question: "Who are the main competitors in the AI resume builder space?",
      type: "descriptive",
      status: "answered",
      hypothesisIds: [],
      evidenceIds: ["evidence_competitor_list"],
      priority: "high",
      metadata: {}
    },
    {
      id: "question_pricing",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_ai_resume_market",
      question: "What pricing models work best for resume builder tools?",
      type: "evaluative",
      status: "in_progress",
      hypothesisIds: [],
      evidenceIds: [],
      priority: "medium",
      metadata: {}
    },
    {
      id: "question_competitor_features",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_competitor_analysis",
      question: "What features do top competitors offer?",
      type: "descriptive",
      status: "answered",
      hypothesisIds: [],
      evidenceIds: [],
      priority: "high",
      metadata: {}
    }
  );

  state.sources.push(
    {
      id: "source_resume_io",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_ai_resume_market",
      sourceType: "website",
      title: "Resume.io Website",
      url: "https://resume.io",
      author: "Resume.io Inc.",
      publishedAt: createdAt,
      reliability: "high",
      content: "Popular resume builder with AI writing assistance and ATS optimization",
      tags: ["competitor", "resume", "ai"],
      metadata: { pricing: "Freemium", features: ["AI writing", "ATS checker", "Templates"] }
    },
    {
      id: "source_enhancv",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_ai_resume_market",
      sourceType: "review",
      title: "Enhancv Review - Trustpilot",
      url: "https://trustpilot.com/review/enhancv.com",
      author: "Various users",
      reliability: "medium",
      content: "Users appreciate beautiful templates but want better ATS compatibility",
      tags: ["review", "competitor", "user-feedback"],
      metadata: { rating: 4.2 }
    },
    {
      id: "source_kickresume",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_competitor_analysis",
      sourceType: "website",
      title: "Kickresume Website",
      url: "https://kickresume.com",
      reliability: "high",
      content: "AI-powered resume builder with AI writer and cover letter generator",
      tags: ["competitor", "ai", "cover-letter"],
      metadata: { pricing: "Freemium", features: ["AI writer", "Cover letter", "LinkedIn import"] }
    }
  );

  state.notes.push({
    id: "note_market_opportunity",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    studyId: "study_ai_resume_market",
    questionId: "question_pain_points",
    title: "ATS Feedback Gap",
    content: "Most resume builders offer templates but lack real ATS compatibility feedback. Users need to know if their resume will pass ATS screening before applying.",
    authorId: "user_researcher",
    tags: ["opportunity", "ats", "pain-point"],
    linkedSourceIds: ["source_enhancv"],
    metadata: {}
  });

  state.hypotheses.push({
    id: "hypothesis_ats_feedback",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    questionId: "question_pain_points",
    statement: "Job seekers would pay for a tool that provides detailed ATS compatibility feedback",
    confidence: "high",
    status: "testing",
    evidenceIds: ["evidence_ats_complaint"],
    metadata: {}
  });

  state.evidence.push(
    {
      id: "evidence_ats_complaint",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      sourceId: "source_enhancv",
      hypothesisId: "hypothesis_ats_feedback",
      type: "testimonial",
      content: "The tool looks great but my resume still gets rejected by ATS systems. Would love real ATS feedback.",
      relevance: "high",
      strength: "strong",
      insightIds: ["insight_ats_feedback"],
      metadata: {}
    },
    {
      id: "evidence_competitor_list",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      sourceId: "source_resume_io",
      type: "fact",
      content: "Resume.io has over 10 million users and offers AI-powered writing assistance",
      relevance: "high",
      strength: "moderate",
      insightIds: [],
      metadata: {}
    }
  );

  state.insights.push(
    {
      id: "insight_ats_feedback",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_ai_resume_market",
      insightType: "opportunity",
      title: "ATS Feedback Gap",
      observation: "Job seekers want ATS compatibility feedback but most tools don't provide it",
      evidence: ["Users complain about lack of ATS feedback in reviews", "No competitor offers detailed ATS analysis"],
      meaning: "CareerOS can differentiate by leading with ATS score and JD match features",
      impact: "high",
      confidence: "high",
      status: "published",
      nextActions: ["Create ATS scoring feature MVP", "Research JD matching opportunity"],
      metadata: {}
    },
    {
      id: "insight_differentiation",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_competitor_analysis",
      insightType: "opportunity",
      title: "Differentiation Through Integration",
      observation: "Competitors focus on single features (templates, AI writing, cover letters) but lack integration",
      evidence: ["Each competitor does one thing well", "Users need multiple tools for job search"],
      meaning: "CareerOS can win by integrating resume + JD + learning + interview prep in one platform",
      impact: "high",
      confidence: "medium",
      status: "draft",
      nextActions: ["Design integrated product experience", "Validate with target users"],
      metadata: {}
    }
  );

  state.competitors.push(
    {
      id: "competitor_resume_io",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_competitor_analysis",
      name: "Resume.io",
      productName: "Resume.io",
      website: "https://resume.io",
      targetAudience: "Job seekers, professionals",
      description: "Popular AI-powered resume builder with ATS optimization",
      strengths: ["Large user base", "AI writing assistant", "ATS checker", "Good templates"],
      weaknesses: ["Limited JD matching", "No learning integration", "Generic feedback"],
      pricing: "Freemium (free limited, paid $24/month)",
      features: [
        { name: "AI writing", available: true, quality: "high" },
        { name: "ATS checker", available: true, quality: "medium" },
        { name: "JD matching", available: false, quality: "low" },
        { name: "Learning resources", available: false, quality: "low" }
      ],
      reviews: [
        { source: "Trustpilot", rating: 4.5, summary: "Great templates but ATS feedback could be better" }
      ],
      metadata: { users: "10M+", founded: "2018" }
    },
    {
      id: "competitor_enhancv",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      studyId: "study_competitor_analysis",
      name: "Enhancv",
      productName: "Enhancv",
      website: "https://enhancv.com",
      targetAudience: "Professionals, creatives",
      description: "Design-focused resume builder with storytelling emphasis",
      strengths: ["Beautiful designs", "Storytelling focus", "Modern UI"],
      weaknesses: ["Weak ATS optimization", "Higher price point", "Limited AI features"],
      pricing: "Free basic, $24/month pro",
      features: [
        { name: "AI writing", available: true, quality: "medium" },
        { name: "ATS checker", available: false, quality: "low" },
        { name: "JD matching", available: false, quality: "low" },
        { name: "Design focus", available: true, quality: "high" }
      ],
      reviews: [
        { source: "G2", rating: 4.6, summary: "Love the designs but ATS compatibility is a problem" }
      ],
      metadata: {}
    }
  );

  state.interviews.push({
    id: "interview_job_seeker_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    studyId: "study_ai_resume_market",
    participantName: "Alex Chen",
    participantRole: "Software Engineer, 3 years experience",
    interviewType: "discovery",
    status: "completed",
    scheduledAt: createdAt,
    completedAt: createdAt,
    questions: [
      { question: "What frustrates you about current resume tools?", answer: "I don't know if my resume will pass ATS. Tools just give templates without feedback.", keyInsight: "ATS uncertainty is major pain point" },
      { question: "What would make you pay for a resume tool?", answer: "Real feedback on ATS compatibility and how to improve my resume for specific jobs.", keyInsight: "Willing to pay for ATS insights" }
    ],
    painPoints: ["No ATS feedback", "Don't know if resume is good enough", "Generic advice"],
    quotes: ["I apply to 50+ jobs and never hear back. I wish I knew why."],
    metadata: {}
  });

  state.surveys.push({
    id: "survey_resume_preferences",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    studyId: "study_ai_resume_market",
    name: "Resume Builder User Preferences Survey",
    description: "Understand what features job seekers want most in resume building tools",
    targetAudience: "Job seekers with 1-10 years experience",
    status: "active",
    questions: [
      { question: "What is most important in a resume tool?", type: "multiple_choice", options: ["Templates", "AI writing", "ATS feedback", "Job matching"] },
      { question: "Would you pay for ATS feedback?", type: "boolean" },
      { question: "What is your biggest resume challenge?", type: "open" }
    ],
    responses: [
      { respondentId: "respondent_1", answers: { "What is most important in a resume tool?": "ATS feedback", "Would you pay for ATS feedback?": true }, submittedAt: createdAt }
    ],
    metadata: { targetResponses: 100 }
  });

  state.painPoints.push({
    id: "painpoint_ats_unknown",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    studyId: "study_ai_resume_market",
    description: "Job seekers don't know if their resume will pass ATS screening",
    severity: "high",
    frequency: "frequent",
    currentSolution: "Submit and hope for the best",
    opportunity: "Real-time ATS scoring and improvement suggestions",
    relatedSourceIds: ["source_enhancv", "evidence_ats_complaint"],
    metadata: {}
  });

  state.marketSegments.push({
    id: "segment_freshers",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    studyId: "study_ai_resume_market",
    name: "Fresh Graduates",
    description: "Recent graduates entering the job market for the first time",
    size: "4M+ annually in US",
    growth: "Growing as college enrollment increases",
    trends: ["Increasing competition", "ATS adoption rising", "Need guidance"],
    metadata: {}
  });

  state.events.push({
    id: "event_research_seeded",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "research.seeded",
    source: "ResearchOS",
    data: { message: "ResearchOS demo data seeded" }
  });

  return state;
}
