import { ContentState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): ContentState {
  const state = emptyState();
  const createdAt = nowIso();

  state.strategies.push({
    id: "strategy_appneural",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "appneural-content",
    name: "APPNEURAL Content Strategy",
    description: "Content strategy for APPNEURAL brand covering AI, systems, automation, and business growth.",
    goals: ["brand awareness", "lead generation", "SEO traffic", "trust building", "product education"],
    targetAudience: "founders, SMEs, developers, enterprises",
    pillars: ["AI for Business", "System Design", "Automation", "Brand Building", "Product Development"],
    channels: ["LinkedIn", "Blog", "Newsletter", "Website"],
    status: "active",
    metrics: { posts: 0, blogs: 0, newsletters: 0 },
    createdBy: "seed"
  });

  state.pillars.push(
    {
      id: "pillar_ai_business",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ai-for-business",
      name: "AI for Business",
      description: "Practical AI applications for business growth and efficiency.",
      topics: ["AI vs Automation", "AI is not magic", "AI needs systems", "SME AI adoption"],
      status: "active",
      contentCount: 0,
      engagementScore: 85,
      createdBy: "seed"
    },
    {
      id: "pillar_system_design",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "system-design",
      name: "System Design",
      description: "Building scalable and maintainable systems.",
      topics: ["Architecture patterns", "Cloud infrastructure", "Microservices", "API design"],
      status: "active",
      contentCount: 0,
      engagementScore: 80,
      createdBy: "seed"
    },
    {
      id: "pillar_automation",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "automation",
      name: "Automation",
      description: "Workflow automation and process optimization.",
      topics: ["No-code automation", "CI/CD pipelines", "Business process automation", "AI agents"],
      status: "active",
      contentCount: 0,
      engagementScore: 75,
      createdBy: "seed"
    },
    {
      id: "pillar_brand",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "brand-building",
      name: "Brand Building",
      description: "Personal and company brand development.",
      topics: ["Brand voice", "Content pillars", "LinkedIn presence", "Thought leadership"],
      status: "active",
      contentCount: 0,
      engagementScore: 70,
      createdBy: "seed"
    },
    {
      id: "pillar_product",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "product-development",
      name: "Product Development",
      description: "Building and launching products.",
      topics: ["MVP development", "Product-market fit", "Launch strategies", "User feedback"],
      status: "active",
      contentCount: 0,
      engagementScore: 72,
      createdBy: "seed"
    }
  );

  state.topics.push(
    {
      id: "topic_ai_systems",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ai-needs-systems",
      title: "AI needs systems",
      description: "Why AI implementations require strong system foundations.",
      pillarId: "pillar_ai_business",
      keywords: ["AI systems", "implementation", "foundation"],
      status: "active",
      contentCount: 0,
      priority: "high",
      createdBy: "seed"
    },
    {
      id: "topic_sme_ai",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "sme-ai-adoption",
      title: "How SMEs can use AI",
      description: "Practical AI adoption guide for small and medium enterprises.",
      pillarId: "pillar_ai_business",
      keywords: ["SME", "small business", "AI adoption"],
      status: "active",
      contentCount: 0,
      priority: "high",
      createdBy: "seed"
    },
    {
      id: "topic_linkedin_framework",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "linkedin-framework",
      title: "LinkedIn framework posts",
      description: "Framework-based LinkedIn content for thought leadership.",
      pillarId: "pillar_brand",
      keywords: ["LinkedIn", "framework", "thought leadership"],
      status: "active",
      contentCount: 0,
      priority: "medium",
      createdBy: "seed"
    }
  );

  state.calendars.push({
    id: "calendar_weekly",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "weekly-content",
    name: "Weekly Content Calendar",
    description: "Weekly content publishing schedule.",
    startDate: createdAt,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    createdBy: "seed"
  });

  state.calendarItems.push(
    {
      id: "cal_monday",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      calendarId: "calendar_weekly",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      platform: "LinkedIn",
      topic: "Educational post",
      format: "text",
      hook: "Quick insight",
      cta: "Comment your thoughts",
      status: "idea",
      createdBy: "seed"
    },
    {
      id: "cal_tuesday",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      calendarId: "calendar_weekly",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      platform: "Blog",
      topic: "Blog article",
      format: "article",
      status: "idea",
      createdBy: "seed"
    },
    {
      id: "cal_wednesday",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      calendarId: "calendar_weekly",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      platform: "LinkedIn",
      topic: "Carousel post",
      format: "carousel",
      status: "idea",
      createdBy: "seed"
    },
    {
      id: "cal_friday",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      calendarId: "calendar_weekly",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      platform: "Newsletter",
      topic: "Weekly digest",
      format: "newsletter",
      status: "idea",
      createdBy: "seed"
    }
  );

  state.briefs.push({
    id: "brief_ai_systems",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "ai-systems-brief",
    title: "AI Needs Systems Post",
    topic: "Why AI implementations require strong system foundations",
    audience: "Founders and business leaders considering AI adoption",
    goal: "Educate and position APPNEURAL as a systems-first AI consultancy",
    tone: "Premium, clear, practical",
    keyMessage: "AI only multiplies what already exists. Build systems first.",
    structure: "Hook -> Problem -> Insight -> Framework -> Example -> CTA",
    keywords: ["AI systems", "implementation", "foundations"],
    cta: "Follow for more insights",
    length: "300-500 words",
    outputFormat: "linkedin_post",
    status: "approved",
    createdBy: "seed"
  });

  state.posts.push({
    id: "post_ai_advantage",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "ai-not-advantage",
    platform: "linkedin",
    format: "text",
    hook: "AI is not your advantage.",
    body: `Your advantage is:
- clean data
- clear workflows
- strong systems
- fast execution

AI only multiplies what already exists.

Build the foundation first.`,
    cta: "What system will you build this week?",
    hashtags: ["AI", "Business", "Systems", "Strategy"],
    status: "published",
    briefId: "brief_ai_systems",
    publishedAt: createdAt,
    metrics: { views: 2500, likes: 180, comments: 25, shares: 45 },
    createdBy: "seed"
  });

  state.blogs.push({
    id: "blog_ai_automation",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "ai-automation-guide",
    title: "Complete Guide to AI Automation for SMEs",
    slug: "ai-automation-guide-smes",
    content: `AI automation is transforming how small and medium enterprises operate. This comprehensive guide covers everything you need to know about implementing AI in your business.

## What is AI Automation?

AI automation combines artificial intelligence with workflow automation to handle repetitive tasks, make decisions, and optimize processes without constant human intervention.

## Why SMEs Should Care

For SMEs, AI automation offers:
- Cost reduction through efficiency
- Better customer experiences
- Scalable operations
- Data-driven decision making

## Getting Started

1. Identify repetitive tasks
2. Assess data quality
3. Choose the right tools
4. Start small, scale gradually

## Common Use Cases

- Customer service chatbots
- Email automation
- Data entry and processing
- Predictive analytics

## Conclusion

AI automation is no longer optional for businesses that want to stay competitive. Start your journey today.`,
    excerpt: "A comprehensive guide to implementing AI automation in small and medium enterprises.",
    authorId: "author_ajay",
    categoryId: "cat_automation",
    tags: ["AI", "Automation", "SME", "Guide"],
    status: "published",
    seoTitle: "AI Automation Guide for Small Businesses | APPNEURAL",
    seoDescription: "Learn how to implement AI automation in your SME with this comprehensive step-by-step guide.",
    readingTime: 12,
    publishedAt: createdAt,
    views: 1500,
    createdBy: "seed"
  });

  state.carousels.push({
    id: "carousel_ai_systems",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "ai-systems-carousel",
    title: "5 Reasons AI Needs Systems First",
    slides: [
      { slideNumber: 1, type: "title", text: "AI Needs Systems First", subtext: "Why foundation matters more than algorithms" },
      { slideNumber: 2, type: "content", text: "1. AI multiplies existing processes", subtext: "Bad processes = bad results" },
      { slideNumber: 3, type: "content", text: "2. Data quality determines outcomes", subtext: "Garbage in, garbage out" },
      { slideNumber: 4, type: "content", text: "3. Systems enable scale", subtext: "Manual processes break under load" },
      { slideNumber: 5, type: "content", text: "4. Governance requires structure", subtext: "Compliance and security need foundations" },
      { slideNumber: 6, type: "cta", text: "Build systems first. Ask APPNEURAL.", subtext: "Your AI journey starts with a solid foundation" }
    ],
    hook: "Thinking about AI? Read this first.",
    cta: "Save this post",
    platform: "LinkedIn",
    status: "published",
    publishedAt: createdAt,
    metrics: { views: 3500, saves: 280, shares: 65 },
    createdBy: "seed"
  });

  state.newsletters.push({
    id: "newsletter_week1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "weekly-digest-1",
    subject: "This Week: AI Systems and Automation Insights",
    preview: "Key takeaways from our latest content on AI and systems.",
    content: "Weekly newsletter covering AI, automation, and business growth.",
    sections: [
      { type: "header", title: "This Week's Insights", content: "Welcome to the APPNEURAL weekly digest." },
      { type: "insight", title: "Key Takeaway", content: "AI needs systems. Build foundations before deploying AI." },
      { type: "article", title: "Featured: AI Automation Guide", content: "Our latest blog on getting started with AI automation.", link: "/blog/ai-automation-guide" },
      { type: "resource", title: "Free Resource", content: "AI Readiness Assessment Template", link: "/resources/ai-assessment" },
      { type: "cta", title: "Work With Us", content: "Need help building your AI systems? Let's talk.", link: "/contact" },
      { type: "footer", content: "© 2024 APPNEURAL. Building intelligent systems." }
    ],
    status: "published",
    sentAt: createdAt,
    openRate: 42,
    clickRate: 12,
    createdBy: "seed"
  });

  state.campaigns.push({
    id: "campaign_brand_q1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "brand-awareness-q1",
    name: "Q1 Brand Awareness Campaign",
    description: "Campaign to establish APPNEURAL as a thought leader in AI and systems.",
    startDate: createdAt,
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    goals: ["brand awareness", "thought leadership", "lead generation"],
    channels: ["LinkedIn", "Blog", "Newsletter", "Website"],
    contentIds: ["post_ai_advantage", "blog_ai_automation", "carousel_ai_systems"],
    status: "active",
    metrics: { reach: 10000, engagement: 500, leads: 25 },
    createdBy: "seed"
  });

  state.templates.push({
    id: "template_linkedin_hook",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "linkedin-hook-template",
    name: "LinkedIn Hook Template",
    description: "Template for creating engaging LinkedIn hooks.",
    type: "post",
    content: "{{hook_statement}}\n\n{{contrast or_list or_framework}}\n\n{{your_takeaway}}\n\n{{cta}}",
    variables: ["hook_statement", "contrast", "list", "framework", "takeaway", "cta"],
    tags: ["LinkedIn", "Hook", "Template"],
    status: "active",
    usageCount: 5,
    createdBy: "seed"
  });

  state.keywords.push(
    {
      id: "kw_ai_automation",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      keyword: "AI automation",
      searchVolume: 12000,
      difficulty: 65,
      intent: "informational",
      relatedKeywords: ["automation", "AI tools", "business automation"],
      contentCount: 1,
      status: "active"
    },
    {
      id: "kw_sme_digital",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      keyword: "SME digital transformation",
      searchVolume: 8000,
      difficulty: 55,
      intent: "informational",
      relatedKeywords: ["digital transformation", "small business", "technology adoption"],
      contentCount: 0,
      status: "active"
    }
  );

  state.events.push({
    id: "event_seed",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "contentos.seeded",
    source: "ContentOS",
    data: { message: "ContentOS demo data seeded" }
  });

  return state;
}
