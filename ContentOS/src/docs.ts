export function docs() {
  return {
    name: "ContentOS",
    version: "1.0.0",
    description: "Content creation, publishing, CMS, blogs, SEO, localization, and content lifecycle management",
    auth: {
      headers: {
        "x-role": "owner | admin | content_admin | content_editor | content_creator | content_reviewer | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      strategy: "Content strategy defining goals, target audience, pillars, and channels.",
      pillar: "Content pillars organizing content into repeatable themes.",
      topic: "Content topics generated from keywords, questions, and pain points.",
      calendar: "Publishing schedule with platform-specific content planning.",
      brief: "Structured writing instructions with audience, tone, keywords, and CTA.",
      post: "Social media posts for LinkedIn, Twitter, Instagram, etc.",
      blog: "Long-form articles with SEO optimization.",
      carousel: "Educational carousel content with structured slides.",
      newsletter: "Email content with sections for insights, articles, and CTAs.",
      campaign: "Themed content campaigns with goals and metrics."
    },
    examples: {
      createStrategy: {
        method: "POST",
        path: "/contentos/strategies",
        headers: { "x-role": "content_admin" },
        body: {
          key: "appneural-content",
          name: "APPNEURAL Content Strategy",
          goals: ["brand awareness", "lead generation", "SEO traffic"],
          targetAudience: "founders, SMEs, developers",
          pillars: ["AI for Business", "System Design", "Automation"],
          channels: ["LinkedIn", "Blog", "Newsletter"]
        }
      },
      createPost: {
        method: "POST",
        path: "/contentos/posts",
        headers: { "x-role": "content_editor" },
        body: {
          key: "ai-systems-post",
          platform: "linkedin",
          format: "text",
          hook: "AI is not your advantage.",
          body: "Your advantage is: clean data, clear workflows, strong systems, fast execution.",
          hashtags: ["AI", "Business", "Systems"],
          briefId: "brief_ai_systems"
        }
      },
      createBlog: {
        method: "POST",
        path: "/contentos/blogs",
        headers: { "x-role": "content_editor" },
        body: {
          key: "ai-automation-guide",
          title: "Complete Guide to AI Automation for SMEs",
          slug: "ai-automation-guide-smes",
          content: "Full article content here...",
          categoryId: "cat_automation",
          tags: ["AI", "Automation", "SME"],
          seoTitle: "AI Automation Guide for Small Businesses",
          seoDescription: "Learn how to implement AI automation in your SME step by step."
        }
      },
      checkQuality: {
        method: "POST",
        path: "/contentos/quality/check",
        headers: { "x-role": "content_editor" },
        body: {
          title: "Post title",
          content: "Post content to check...",
          platform: "linkedin"
        }
      }
    }
  };
}
