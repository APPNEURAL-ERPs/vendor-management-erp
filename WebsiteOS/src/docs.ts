export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  body?: { type: string; description: string };
  response: string;
}

export interface ApiDocumentation {
  title: string;
  version: string;
  baseUrl: string;
  description: string;
  endpoints: ApiEndpoint[];
}

export const apiDocs: ApiDocumentation = {
  title: "WebsiteOS API",
  version: "1.0.0",
  baseUrl: "/websiteos",
  description: "WebsiteOS provides APIs for website management, page building, SEO optimization, form handling, and analytics tracking.",
  endpoints: [
    {
      method: "GET",
      path: "/health",
      description: "Check API health status",
      response: "{ ok: boolean, timestamp: string }",
    },
    {
      method: "GET",
      path: "/docs",
      description: "Get API documentation",
      response: "ApiDocumentation",
    },
    {
      method: "GET",
      path: "/dashboard",
      description: "Get website dashboard with summary metrics",
      response: "{ totalWebsites, totalPages, publishedPages, draftPages, totalForms, totalSubmissions, avgSEOScore }",
    },
    {
      method: "GET",
      path: "/websites",
      description: "List all websites",
      response: "Website[]",
    },
    {
      method: "POST",
      path: "/websites",
      description: "Create a new website",
      body: "{ name: string, domain: string, description?: string }",
      response: "Website",
    },
    {
      method: "GET",
      path: "/websites/:id",
      description: "Get website by ID",
      response: "Website",
    },
    {
      method: "PATCH",
      path: "/websites/:id",
      description: "Update website",
      body: "{ name?: string, description?: string, settings?: WebsiteSettings }",
      response: "Website",
    },
    {
      method: "DELETE",
      path: "/websites/:id",
      description: "Delete website and all associated pages",
      response: "{ ok: boolean }",
    },
    {
      method: "GET",
      path: "/websites/:websiteId/pages",
      description: "List all pages for a website",
      response: "WebsitePage[]",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/pages",
      description: "Create a new page",
      body: "{ title: string, slug?: string, pageType?: PageType, content?: string, sections?: PageSection[], seo?: SEOSettings }",
      response: "WebsitePage",
    },
    {
      method: "GET",
      path: "/pages/:id",
      description: "Get page by ID",
      response: "WebsitePage",
    },
    {
      method: "PATCH",
      path: "/pages/:id",
      description: "Update page",
      body: "{ title?: string, content?: string, sections?: PageSection[], seo?: SEOSettings }",
      response: "WebsitePage",
    },
    {
      method: "POST",
      path: "/pages/:id/publish",
      description: "Publish a page",
      response: "WebsitePage",
    },
    {
      method: "DELETE",
      path: "/pages/:id",
      description: "Delete page",
      response: "{ ok: boolean }",
    },
    {
      method: "GET",
      path: "/websites/:websiteId/landing-pages",
      description: "List all landing pages",
      response: "LandingPage[]",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/landing-pages",
      description: "Create a landing page",
      body: "{ name: string, headline: string, offer: string, subheadline?: string }",
      response: "LandingPage",
    },
    {
      method: "GET",
      path: "/landing-pages/:id",
      description: "Get landing page by ID",
      response: "LandingPage",
    },
    {
      method: "PATCH",
      path: "/landing-pages/:id",
      description: "Update landing page",
      response: "LandingPage",
    },
    {
      method: "GET",
      path: "/websites/:websiteId/forms",
      description: "List all forms",
      response: "Form[]",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/forms",
      description: "Create a form",
      body: "{ name: string, type: FormType, fields?: FormField[], settings?: FormSettings }",
      response: "Form",
    },
    {
      method: "GET",
      path: "/forms/:id",
      description: "Get form by ID",
      response: "Form",
    },
    {
      method: "PATCH",
      path: "/forms/:id",
      description: "Update form",
      response: "Form",
    },
    {
      method: "POST",
      path: "/forms/:id/submissions",
      description: "Submit form data",
      body: "{ fields: Record<string, unknown> }",
      response: "FormSubmission",
    },
    {
      method: "GET",
      path: "/forms/:formId/submissions",
      description: "List form submissions",
      response: "FormSubmission[]",
    },
    {
      method: "GET",
      path: "/submissions",
      description: "List all form submissions",
      response: "FormSubmission[]",
    },
    {
      method: "GET",
      path: "/websites/:websiteId/ctas",
      description: "List all CTAs",
      response: "CTA[]",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/ctas",
      description: "Create a CTA",
      body: "{ text: string, url: string, type?: CTAType, position?: CTAPosition }",
      response: "CTA",
    },
    {
      method: "GET",
      path: "/websites/:websiteId/domains",
      description: "List all domains",
      response: "Domain[]",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/domains",
      description: "Add a domain",
      body: "{ domain: string }",
      response: "Domain",
    },
    {
      method: "GET",
      path: "/websites/:websiteId/deployments",
      description: "List all deployments",
      response: "Deployment[]",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/deployments",
      description: "Create a deployment",
      body: "{ environment: 'development' | 'staging' | 'production' }",
      response: "Deployment",
    },
    {
      method: "GET",
      path: "/websites/:websiteId/analytics",
      description: "Get website analytics summary",
      response: "AnalyticsSummary",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/analytics",
      description: "Create analytics record",
      body: "{ date?: string, visitors?: number, pageViews?: number }",
      response: "Analytics",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/events",
      description: "Track website event",
      body: "{ event: string, category: string, data?: Record<string, unknown> }",
      response: "WebsiteEvent",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/sitemap",
      description: "Generate sitemap for website",
      response: "Sitemap",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/audit/seo",
      description: "Run SEO audit",
      response: "WebsiteAudit",
    },
    {
      method: "POST",
      path: "/websites/:websiteId/audit/cro",
      description: "Run CRO check",
      body: "{ pageId?: string }",
      response: "CROCheck",
    },
  ],
};

export function getDocs(): ApiDocumentation {
  return apiDocs;
}

export function formatDocsAsMarkdown(): string {
  let md = `# ${apiDocs.title}\n\n`;
  md += `**Version:** ${apiDocs.version}\n\n`;
  md += `**Base URL:** ${apiDocs.baseUrl}\n\n`;
  md += `${apiDocs.description}\n\n`;
  md += `---\n\n`;

  for (const endpoint of apiDocs.endpoints) {
    md += `## ${endpoint.method} ${endpoint.path}\n\n`;
    md += `${endpoint.description}\n\n`;

    if (endpoint.parameters && endpoint.parameters.length > 0) {
      md += `**Parameters:**\n`;
      for (const param of endpoint.parameters) {
        md += `- ${param.name} (${param.type})${param.required ? " *" : ""}: ${param.description}\n`;
      }
      md += `\n`;
    }

    if (endpoint.body) {
      md += `**Request Body:**\n`;
      md += `\`\`\`json\n${endpoint.body.type}\n\`\`\`\n`;
      md += `${endpoint.body.description}\n\n`;
    }

    md += `**Response:**\n`;
    md += `\`\`\`\n${endpoint.response}\n\`\`\`\n\n`;
    md += `---\n\n`;
  }

  return md;
}
