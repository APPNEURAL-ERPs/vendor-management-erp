import { BrandState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): BrandState {
  const state = emptyState();
  const createdAt = nowIso();

  state.brands.push({
    id: "brand_appneural",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "appneural",
    name: "APPNEURAL",
    description: "AI + Systems + Automation company for business and technology transformation",
    status: "active",
    purpose: "Help people and businesses build structured, intelligent, automated systems",
    mission: "Empower organizations through systematic AI solutions that drive efficiency and growth",
    vision: "A world where every business operates with intelligent automation at its core",
    values: ["Innovation", "Structure", "Practicality", "Automation", "Transparency"],
    positioning: "AI + Systems + Automation company for business and technology transformation",
    differentiation: "System-first approach to AI implementation",
    promise: "From chaos to structured, intelligent business systems",
    story: "APPNEURAL was founded on the belief that AI should create structure, not complexity",
    archetype: "The Architect",
    targetAudience: ["SMEs", "Startups", "Enterprises", "Technology Leaders"],
    industry: "Technology",
    tags: ["AI", "Automation", "Systems", "Business"]
  });

  state.colorPalettes.push({
    id: "palette_appneural",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "appneural_colors",
    name: "APPNEURAL Color Palette",
    description: "Primary brand colors for APPNEURAL",
    status: "active",
    colors: [
      {
        key: "primary",
        name: "APPNEURAL Blue",
        hex: "#5289F2",
        rgb: { r: 82, g: 137, b: 242 },
        usage: "Primary brand color for CTAs, links, and key headings"
      },
      {
        key: "secondary",
        name: "Deep Navy",
        hex: "#1A365D",
        rgb: { r: 26, g: 54, b: 93 },
        usage: "Secondary color for backgrounds, emphasis, and contrast"
      },
      {
        key: "accent",
        name: "Electric Teal",
        hex: "#38B2AC",
        rgb: { r: 56, g: 178, b: 172 },
        usage: "Accent color for highlights and success states"
      },
      {
        key: "neutral",
        name: "Slate Gray",
        hex: "#64748B",
        rgb: { r: 100, g: 116, b: 139 },
        usage: "Body text and secondary elements"
      },
      {
        key: "background",
        name: "Off White",
        hex: "#F8FAFC",
        rgb: { r: 248, g: 250, b: 252 },
        usage: "Page backgrounds and cards"
      }
    ],
    usage: "Use primary blue as dominant color, navy for depth, teal for accents"
  });

  state.typographies.push({
    id: "typography_appneural",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "appneural_typography",
    name: "APPNEURAL Typography System",
    description: "Font families and text styles",
    status: "active",
    fontFamilies: [
      {
        name: "Inter",
        role: "primary",
        weights: [400, 500, 600, 700],
        googleFont: "Inter"
      },
      {
        name: "JetBrains Mono",
        role: "monospace",
        weights: [400, 500],
        googleFont: "JetBrains+Mono"
      }
    ],
    headingStyle: {
      fontFamily: "Inter",
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: "1.2",
      letterSpacing: "-0.02em"
    },
    bodyStyle: {
      fontFamily: "Inter",
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: "1.6"
    },
    usage: "Inter for all UI and marketing text, JetBrains Mono for code"
  });

  state.brandVoices.push({
    id: "voice_appneural",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "appneural_voice",
    name: "APPNEURAL Brand Voice",
    description: "How APPNEURAL speaks to its audience",
    status: "active",
    tone: ["Clear", "Strategic", "Enterprise-grade", "Practical", "System-first", "Human"],
    vocabulary: {
      preferredTerms: ["automated", "structured", "intelligent", "optimized", "systems", "workflow", "efficiency"],
      alternativeTerms: {}
    },
    writingRules: [
      { rule: "Use active voice", example: "We build systems that scale" },
      { rule: "Be concise and actionable", example: "Automate. Scale. Grow." },
      { rule: "Avoid jargon", example: "Use clear language over buzzwords" },
      { rule: "Show transformation", example: "Focus on before/after outcomes" }
    ],
    forbiddenTerms: ["disruptive", "revolutionary", "synergy", "game-changer"],
    audienceTone: [
      {
        audience: "Enterprise",
        tone: ["Formal", "Strategic", "Results-focused"],
        examples: ["Enterprise-grade automation solutions", "ROI-driven implementation"]
      },
      {
        audience: "Startup",
        tone: ["Energetic", "Practical", "Growth-focused"],
        examples: ["Scale faster with AI-powered workflows", "Launch in weeks, not months"]
      }
    ],
    usage: "Professional but approachable, technical but accessible"
  });

  state.brandElements.push({
    id: "element_appneural_logo",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "appneural_logo",
    name: "APPNEURAL Logo",
    type: "logo",
    status: "active",
    variants: [
      { name: "Full Logo Dark", format: "svg", background: "dark" },
      { name: "Full Logo Light", format: "svg", background: "light" },
      { name: "Icon Only", format: "svg", background: "transparent" },
      { name: "Wordmark", format: "svg", background: "transparent" }
    ],
    usage: "Primary logo for all official communications",
    rules: [
      "Maintain clear space equal to letter height",
      "Minimum size: 32px height for digital, 10mm for print",
      "Do not stretch, rotate, or add effects"
    ]
  });

  state.guidelines.push({
    id: "guideline_appneural_full",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "appneural_full_guidelines",
    name: "APPNEURAL Brand Guidelines",
    description: "Complete brand guidelines document",
    status: "active",
    type: "full",
    version: 1,
    createdBy: "seed",
    sections: [
      {
        title: "Brand Overview",
        content: "APPNEURAL is an AI + Systems + Automation company that helps businesses build structured, intelligent, automated systems."
      },
      {
        title: "Logo Usage",
        content: "Use the APPNEURAL logo with proper clear space and sizing guidelines.",
        rules: [
          "Always use approved logo files",
          "Maintain clear space on all sides",
          "Use correct colors from brand palette"
        ],
        dos: ["Use logo on approved backgrounds"],
        donts: ["Do not stretch or distort the logo", "Do not add shadows or effects"]
      },
      {
        title: "Color Palette",
        content: "APPNEURAL's color palette communicates trust, innovation, and professionalism.",
        rules: [
          "Primary blue (#5289F2) should be dominant",
          "Use navy for depth and contrast",
          "Teal for accents and success states"
        ]
      },
      {
        title: "Typography",
        content: "Inter is our primary typeface for all communications.",
        rules: [
          "Use Inter for all UI and marketing text",
          "Use JetBrains Mono for code blocks"
        ]
      },
      {
        title: "Voice & Tone",
        content: "APPNEURAL speaks clearly, strategically, and practically.",
        rules: ["Be clear and concise", "Use active voice", "Avoid jargon"]
      },
      {
        title: "Social Media",
        content: "Follow brand guidelines for all social posts.",
        rules: [
          "Use brand colors in social graphics",
          "Follow voice guidelines in copy",
          "Use approved logo placement"
        ]
      }
    ]
  });

  state.brandKits.push({
    id: "kit_appneural",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "appneural_kit",
    name: "APPNEURAL Brand Kit",
    description: "Complete brand kit with colors, typography, voice, and assets",
    status: "active",
    colorPaletteId: "palette_appneural",
    typographyId: "typography_appneural",
    voiceId: "voice_appneural",
    assets: ["element_appneural_logo"],
    generatedAt: createdAt,
    generatedBy: "seed"
  });

  state.brandMessages.push({
    id: "msg_appneural_tagline",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "appneural_tagline",
    name: "APPNEURAL Tagline",
    type: "tagline",
    status: "active",
    content: "Systems that think. Workflows that move.",
    usage: "Primary tagline for all marketing materials",
    variants: [
      "Build smarter business systems.",
      "From idea to intelligent execution.",
      "Structure your business. Automate your growth."
    ]
  });

  state.brandMessages.push({
    id: "msg_appneural_headline",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "appneural_headline",
    name: "APPNEURAL Hero Headline",
    type: "headline",
    status: "active",
    content: "Empowering People and Businesses through Systems, Intelligence & Automation.",
    usage: "Hero section for website and presentations"
  });

  state.brandMessages.push({
    id: "msg_appneural_elevator",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "appneural_elevator",
    name: "APPNEURAL Elevator Pitch",
    type: "elevator_pitch",
    status: "active",
    content: "APPNEURAL helps businesses build structured, intelligent, automated systems using AI. We turn complex workflows into simple, scalable processes.",
    usage: "Quick company introduction"
  });

  state.templates.push({
    id: "template_linkedin",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "linkedin_post",
    name: "LinkedIn Post Template",
    type: "social",
    status: "active",
    content: "{{hook}}\n\n{{body}}\n\n{{cta}}\n\n{{hashtags}}",
    format: "text",
    usage: "Template for branded LinkedIn posts",
    tags: ["linkedin", "social", "content"]
  });

  state.templates.push({
    id: "template_proposal",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "proposal",
    name: "Proposal Template",
    type: "proposal",
    status: "active",
    content: "Proposal for {{client}}\n\nExecutive Summary\n{{summary}}\n\nOur Approach\n{{approach}}\n\nTimeline\n{{timeline}}\n\nInvestment\n{{investment}}",
    format: "docx",
    usage: "Branded proposal template",
    tags: ["proposal", "document", "sales"]
  });

  state.personas.push({
    id: "persona_startup_founder",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "startup_founder",
    name: "Startup Founder",
    description: "Early-stage startup founder looking to scale quickly",
    status: "active",
    demographics: {
      ageRange: "25-40",
      location: "Urban areas",
      occupation: "Founder/CEO",
      industry: "Technology"
    },
    psychographics: {
      values: ["Speed", "Growth", "Innovation"],
      interests: ["Product development", "Fundraising", "Team building"],
      goals: ["Scale quickly", "Reduce costs", "Build sustainable systems"],
      challenges: ["Limited resources", "Rapid change", "Team scaling"]
    },
    painPoints: ["Manual processes slowing growth", "Inconsistent workflows", "Scaling challenges"],
    motivations: ["Growth", "Efficiency", "Competitive advantage"],
    preferredChannels: ["LinkedIn", "Email", "Product demos"],
    messagingTone: "Energetic, practical, growth-focused"
  });

  state.personas.push({
    id: "persona_enterprise_cto",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    brandId: "brand_appneural",
    key: "enterprise_cto",
    name: "Enterprise CTO",
    description: "Technology leader at a large organization seeking automation solutions",
    status: "active",
    demographics: {
      ageRange: "35-55",
      location: "Major metros",
      occupation: "CTO/VP Engineering",
      industry: "Various"
    },
    psychographics: {
      values: ["Reliability", "Security", "Scalability"],
      interests: ["Architecture", "Integration", "ROI"],
      goals: ["Modernize operations", "Reduce technical debt", "Enable innovation"],
      challenges: ["Legacy systems", "Compliance requirements", "Stakeholder alignment"]
    },
    painPoints: ["Complex legacy systems", "Integration difficulties", "Security concerns"],
    motivations: ["Reliability", "Proven ROI", "Enterprise support"],
    preferredChannels: ["Email", "Sales meetings", "Case studies", "Analyst reports"],
    messagingTone: "Formal, strategic, results-focused"
  });

  state.events.push({
    id: "event_brandos_seeded",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "brandos.seeded",
    source: "BrandOS",
    data: { message: "BrandOS demo data seeded" }
  });

  return state;
}
