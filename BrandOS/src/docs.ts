export function docs() {
  return {
    name: "BrandOS",
    version: "1.0.0",
    description: "BrandOS: brand identity, brand strategy, visual consistency, messaging, content style, and brand asset management layer",
    auth: {
      headers: {
        "x-role": "owner | admin | brand_admin | brand_manager | brand_auditor | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      brand: "Core brand entity containing strategy, identity, and positioning information.",
      colorPalette: "Collection of brand colors with usage guidelines.",
      typography: "Font families and text styles for brand communications.",
      brandVoice: "Tone, vocabulary, and writing rules for brand messaging.",
      asset: "Reusable brand files including logos, icons, fonts, and templates.",
      guideline: "Documentation for brand usage across different contexts.",
      brandKit: "Complete brand package combining colors, typography, voice, and assets.",
      brandCampaign: "Marketing campaign with messaging and assets.",
      brandMessage: "Reusable brand copy including taglines, headlines, and CTAs.",
      brandAudit: "Assessment of brand consistency across channels.",
      consistencyCheck: "Check for brand alignment in content or documents.",
      brandTemplate: "Reusable template for brand communications.",
      brandPersona: "Target audience persona with demographics and psychographics."
    },
    examples: {
      createBrand: {
        method: "POST",
        path: "/brandos/brands",
        headers: { "x-role": "brand_admin" },
        body: {
          key: "appneural",
          name: "APPNEURAL",
          description: "AI + Systems + Automation company",
          purpose: "Help people and businesses build structured, intelligent, automated systems",
          positioning: "AI + Systems + Automation company for business and technology transformation",
          values: ["Innovation", "Structure", "Practicality", "Automation"],
          targetAudience: ["SMEs", "Startups", "Enterprises"],
          industry: "Technology",
          tags: ["AI", "Automation", "Systems"]
        }
      },
      createColorPalette: {
        method: "POST",
        path: "/brandos/color-palettes",
        headers: { "x-role": "brand_manager" },
        body: {
          brandId: "brand_appneural",
          key: "appneural_colors",
          name: "APPNEURAL Color Palette",
          colors: [
            { key: "primary", name: "APPNEURAL Blue", hex: "#5289F2", usage: "Primary brand color for CTAs and headings" },
            { key: "secondary", name: "Deep Navy", hex: "#1A365D", usage: "Secondary color for backgrounds and emphasis" },
            { key: "accent", name: "Electric Teal", hex: "#38B2AC", usage: "Accent color for highlights" }
          ]
        }
      },
      createBrandVoice: {
        method: "POST",
        path: "/brandos/brand-voices",
        headers: { "x-role": "brand_manager" },
        body: {
          brandId: "brand_appneural",
          key: "appneural_voice",
          name: "APPNEURAL Voice",
          tone: ["Clear", "Strategic", "Enterprise-grade", "Practical", "System-first", "Human"],
          vocabulary: {
            preferredTerms: ["automated", "structured", "intelligent", "optimized", "systems"],
            alternativeTerms: {}
          },
          writingRules: [
            { rule: "Use active voice", example: "We build systems" },
            { rule: "Be concise and actionable", example: "Automate. Scale. Grow." }
          ],
          forbiddenTerms: ["disruptive", "revolutionary", "synergy"]
        }
      },
      generateGuideline: {
        method: "POST",
        path: "/brandos/guidelines/generate",
        headers: { "x-role": "brand_admin" },
        body: {
          brandId: "brand_appneural",
          type: "full",
          name: "APPNEURAL Brand Guidelines"
        }
      },
      consistencyCheck: {
        method: "POST",
        path: "/brandos/consistency/check",
        headers: { "x-role": "brand_auditor" },
        body: {
          brandId: "brand_appneural",
          targetType: "content",
          targetContent: "Build smarter workflows with our AI-powered platform"
        }
      }
    },
    tools: {
      strategy: ["Brand Strategy Builder", "Brand Purpose Generator", "Brand Positioning Builder"],
      identity: ["Brand Identity Builder", "Logo Brief Generator", "Color Palette Builder", "Typography System Builder"],
      voice: ["Brand Voice Builder", "Tone of Voice Generator", "Writing Rule Builder"],
      messaging: ["Tagline Generator", "Headline Generator", "Elevator Pitch Generator", "Social Bio Generator"],
      assets: ["Brand Asset Library", "Logo Library", "Template Library"],
      consistency: ["Brand Consistency Checker", "Tone Consistency Checker", "Visual Style Checker"],
      audit: ["Brand Audit Generator", "Website Brand Audit", "Social Brand Audit"]
    }
  };
}
