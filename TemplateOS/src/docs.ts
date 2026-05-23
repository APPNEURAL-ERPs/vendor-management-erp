export function docs() {
  return {
    name: "TemplateOS",
    version: "1.0.0",
    description: "Reusable blueprint engine for documents, websites, workflows, prompts, agents, APIs, data models, dashboards, forms, certificates, policies, and micro-ERP starter kits.",
    auth: {
      headers: {
        "x-role": "owner | admin | template_admin | template_builder | template_viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      template: "A reusable blueprint with versioned content and variables for rendering dynamic outputs.",
      category: "Organizational grouping for templates by type (document, website, workflow, email, etc.).",
      variable: "A named placeholder in template content with type, validation, and default value.",
      render: "The result of applying variable values to a template's content.",
      version: "A specific revision of template content with its variables."
    },
    examples: {
      createTemplate: {
        method: "POST",
        path: "/templateos/templates",
        headers: { "x-role": "template_builder" },
        body: {
          key: "invoice-email",
          name: "Invoice Email Template",
          type: "email",
          categoryId: "cat_email",
          content: "Dear {{customer_name}}, your invoice #{{invoice_number}} for {{amount}} is due on {{due_date}}. Pay here: {{payment_link}}",
          tags: ["invoice", "billing", "email"]
        }
      },
      renderTemplate: {
        method: "POST",
        path: "/templateos/templates/:id/render",
        headers: { "x-role": "template_viewer" },
        body: {
          variables: {
            customer_name: "Acme Corp",
            invoice_number: "INV-2024-001",
            amount: "$1,250.00",
            due_date: "2024-02-15",
            payment_link: "https://pay.example.com/inv001"
          }
        }
      },
      validateTemplate: {
        method: "POST",
        path: "/templateos/templates/:id/validate",
        headers: { "x-role": "template_builder" },
        body: {}
      }
    }
  };
}
