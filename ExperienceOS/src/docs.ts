export function docs() {
  return {
    name: "ExperienceOS",
    version: "1.0.0",
    description: "User experience, customer experience, journeys, onboarding, personalization, A/B testing, and experience optimization.",
    auth: {
      headers: {
        "x-role": "owner | admin | experience_admin | ux_designer | ux_analyst | content_manager | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      persona: "User or customer archetype with goals, pain points, and behaviors.",
      journey: "End-to-end path users take through a product or service.",
      onboarding: "Guided setup process to help users reach value quickly.",
      flow: "Step-by-step user flow through a specific interaction.",
      audit: "UX audit evaluating usability, accessibility, and performance.",
      abtest: "Controlled experiment comparing two or more variants.",
      feedback: "User feedback including NPS, ratings, and comments.",
      microcopy: "Short interface text like button labels and error messages."
    },
    examples: {
      createPersona: {
        method: "POST",
        path: "/experienceos/personas",
        headers: { "x-role": "ux_designer" },
        body: {
          key: "job_seeker_pro",
          name: "Professional Job Seeker",
          type: "user",
          goals: ["Find dream job", "Improve skills"],
          painPoints: ["Long application process", "Unclear requirements"]
        }
      },
      createJourney: {
        method: "POST",
        path: "/experienceos/journeys",
        headers: { "x-role": "ux_designer" },
        body: {
          key: "checkout_journey",
          name: "E-commerce Checkout Journey",
          type: "user",
          stages: [
            { name: "Add to Cart", touchpoints: ["Product Page"], emotion: "positive" },
            { name: "Checkout", touchpoints: ["Cart", "Payment"], emotion: "neutral" },
            { name: "Confirmation", touchpoints: ["Success Page"], emotion: "very_positive" }
          ]
        }
      },
      createABTest: {
        method: "POST",
        path: "/experienceos/ab-tests",
        headers: { "x-role": "ux_analyst" },
        body: {
          key: "signup_cta_test",
          name: "Signup CTA Button Test",
          targetType: "button",
          hypothesis: "Green CTA will outperform blue",
          variants: [
            { name: "Blue CTA", weight: 50 },
            { name: "Green CTA", weight: 50 }
          ]
        }
      },
      submitFeedback: {
        method: "POST",
        path: "/experienceos/feedback",
        headers: { "x-role": "viewer" },
        body: {
          type: "nps",
          source: "in_app",
          npsScore: 9,
          text: "Great experience!"
        }
      }
    }
  };
}
