import { TemplateState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): TemplateState {
  const state = emptyState();
  const createdAt = nowIso();

  state.categories.push(
    {
      id: "cat_document",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "document",
      name: "Document Templates",
      description: "Business and operational document templates",
      order: 1,
      status: "active",
      templateCount: 2
    },
    {
      id: "cat_email",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "email",
      name: "Email Templates",
      description: "Transactional and marketing email templates",
      order: 2,
      status: "active",
      templateCount: 2
    },
    {
      id: "cat_website",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "website",
      name: "Website Templates",
      description: "Landing pages and website section templates",
      order: 3,
      status: "active",
      templateCount: 1
    },
    {
      id: "cat_workflow",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workflow",
      name: "Workflow Templates",
      description: "Automation and process workflow templates",
      order: 4,
      status: "active",
      templateCount: 1
    },
    {
      id: "cat_prompt",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "prompt",
      name: "Prompt Templates",
      description: "AI and agent prompt templates",
      order: 5,
      status: "active",
      templateCount: 1
    }
  );

  state.templates.push(
    {
      id: "tpl_invoice_email",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice-email",
      name: "Invoice Email",
      description: "Professional invoice reminder email template with payment link",
      categoryId: "cat_email",
      type: "email",
      status: "published",
      tags: ["invoice", "billing", "reminder", "payment"],
      activeVersion: 1,
      versions: [{
        id: "tplv_invoice_email_1",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        version: 1,
        content: `Dear {{customer_name}},

We hope this message finds you well.

This is a friendly reminder that Invoice #{{invoice_number}} for {{amount}} (including {{tax_type}}) is due on {{due_date}}.

Invoice Details:
- Invoice Number: {{invoice_number}}
- Amount Due: {{amount}}
- Due Date: {{due_date}}
- Payment Link: {{payment_link}}

Please ensure timely payment to avoid any late fees. If you have already paid this invoice, please disregard this message.

For any billing inquiries, contact us at {{support_email}}.

Best regards,
{{company_name}}
{{company_address}}`,
        variables: [
          { id: "var_1", tenantId, createdAt, updatedAt: createdAt, name: "customer_name", label: "Customer Name", type: "text", required: true, placeholder: "Customer or Company Name" },
          { id: "var_2", tenantId, createdAt, updatedAt: createdAt, name: "invoice_number", label: "Invoice Number", type: "text", required: true, placeholder: "INV-2024-001" },
          { id: "var_3", tenantId, createdAt, updatedAt: createdAt, name: "amount", label: "Amount", type: "currency", required: true, placeholder: "$1,000.00" },
          { id: "var_4", tenantId, createdAt, updatedAt: createdAt, name: "tax_type", label: "Tax Type", type: "text", required: false, defaultValue: "GST", placeholder: "GST/VAT/Sales Tax" },
          { id: "var_5", tenantId, createdAt, updatedAt: createdAt, name: "due_date", label: "Due Date", type: "date", required: true, placeholder: "YYYY-MM-DD" },
          { id: "var_6", tenantId, createdAt, updatedAt: createdAt, name: "payment_link", label: "Payment Link", type: "url", required: true, placeholder: "https://pay.example.com/invoice" },
          { id: "var_7", tenantId, createdAt, updatedAt: createdAt, name: "support_email", label: "Support Email", type: "text", required: true, defaultValue: "support@example.com", placeholder: "support@example.com" },
          { id: "var_8", tenantId, createdAt, updatedAt: createdAt, name: "company_name", label: "Company Name", type: "text", required: true, defaultValue: "APPNEURAL" },
          { id: "var_9", tenantId, createdAt, updatedAt: createdAt, name: "company_address", label: "Company Address", type: "text", required: false, placeholder: "123 Business St, City, Country" }
        ],
        notes: "Initial version with professional invoice styling",
        createdBy: "seed"
      }],
      metadata: { author: "TemplateOS Team", style: "professional" },
      createdBy: "seed",
      publishedAt: createdAt
    },
    {
      id: "tpl_welcome_email",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "welcome-email",
      name: "Welcome Email",
      description: "Warm welcome email for new customers with onboarding guidance",
      categoryId: "cat_email",
      type: "email",
      status: "published",
      tags: ["welcome", "onboarding", "new-customer"],
      activeVersion: 1,
      versions: [{
        id: "tplv_welcome_email_1",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        version: 1,
        content: `Hi {{user_name}},

Welcome to {{platform_name}}! We're thrilled to have you on board.

Your Account Details:
- Email: {{user_email}}
- Account ID: {{account_id}}
- Start Date: {{start_date}}

Getting Started:
1. Complete your profile at {{profile_url}}
2. Explore {{platform_name}} features
3. Join our community at {{community_url}}
4. Contact support at {{support_email}} if you need help

We're here to support you every step of the way. Check out our quick start guide attached.

Best,
The {{platform_name}} Team

---
{{company_name}} | {{company_website}}`,
        variables: [
          { id: "var_w1", tenantId, createdAt, updatedAt: createdAt, name: "user_name", label: "User Name", type: "text", required: true, placeholder: "John Doe" },
          { id: "var_w2", tenantId, createdAt, updatedAt: createdAt, name: "user_email", label: "User Email", type: "text", required: true, placeholder: "user@example.com" },
          { id: "var_w3", tenantId, createdAt, updatedAt: createdAt, name: "account_id", label: "Account ID", type: "text", required: true },
          { id: "var_w4", tenantId, createdAt, updatedAt: createdAt, name: "start_date", label: "Start Date", type: "date", required: true },
          { id: "var_w5", tenantId, createdAt, updatedAt: createdAt, name: "platform_name", label: "Platform Name", type: "text", required: true, defaultValue: "APPNEURAL" },
          { id: "var_w6", tenantId, createdAt, updatedAt: createdAt, name: "profile_url", label: "Profile URL", type: "url", required: true, placeholder: "https://app.example.com/profile" },
          { id: "var_w7", tenantId, createdAt, updatedAt: createdAt, name: "community_url", label: "Community URL", type: "url", required: false, placeholder: "https://community.example.com" },
          { id: "var_w8", tenantId, createdAt, updatedAt: createdAt, name: "support_email", label: "Support Email", type: "text", required: true, defaultValue: "support@example.com" },
          { id: "var_w9", tenantId, createdAt, updatedAt: createdAt, name: "company_name", label: "Company Name", type: "text", required: true, defaultValue: "APPNEURAL" },
          { id: "var_w10", tenantId, createdAt, updatedAt: createdAt, name: "company_website", label: "Company Website", type: "url", required: true, defaultValue: "https://appneurox.com" }
        ],
        notes: "Professional welcome email with clear CTA sections",
        createdBy: "seed"
      }],
      metadata: { author: "TemplateOS Team", tone: "warm, professional" },
      createdBy: "seed",
      publishedAt: createdAt
    },
    {
      id: "tpl_service_proposal",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "service-proposal",
      name: "Service Proposal",
      description: "Professional service proposal document template with pricing tables",
      categoryId: "cat_document",
      type: "document",
      status: "published",
      tags: ["proposal", "sales", "business", "pricing"],
      activeVersion: 1,
      versions: [{
        id: "tplv_proposal_1",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        version: 1,
        content: `# Service Proposal

## Prepared For: {{client_name}}
**Date:** {{proposal_date}}
**Proposal Valid Until:** {{valid_until}}

---

## Executive Summary

{{company_name}} is pleased to submit this proposal to {{client_name}} for {{project_name}}.

## Scope of Services

{{scope_description}}

## Deliverables

{{deliverables}}

## Timeline

- **Start Date:** {{start_date}}
- **Estimated Completion:** {{end_date}}
- **Key Milestones:** {{milestones}}

## Investment

| Service | Description | Price |
|---------|-------------|-------|
{{pricing_rows}}

**Total Investment:** {{total_amount}}
**Payment Terms:** {{payment_terms}}

## Terms and Conditions

{{terms_and_conditions}}

## Next Steps

1. Review this proposal
2. Contact us at {{contact_email}}
3. Sign the attached agreement
4. Begin project onboarding

---

**Prepared by:**
{{company_name}}
{{company_email}} | {{company_phone}}
{{company_address}}`,
        variables: [
          { id: "var_p1", tenantId, createdAt, updatedAt: createdAt, name: "client_name", label: "Client Name", type: "text", required: true, placeholder: "Client Company Name" },
          { id: "var_p2", tenantId, createdAt, updatedAt: createdAt, name: "proposal_date", label: "Proposal Date", type: "date", required: true },
          { id: "var_p3", tenantId, createdAt, updatedAt: createdAt, name: "valid_until", label: "Valid Until", type: "date", required: true },
          { id: "var_p4", tenantId, createdAt, updatedAt: createdAt, name: "company_name", label: "Company Name", type: "text", required: true, defaultValue: "APPNEURAL" },
          { id: "var_p5", tenantId, createdAt, updatedAt: createdAt, name: "project_name", label: "Project Name", type: "text", required: true, placeholder: "Digital Transformation Initiative" },
          { id: "var_p6", tenantId, createdAt, updatedAt: createdAt, name: "scope_description", label: "Scope Description", type: "richtext", required: true, placeholder: "Describe the scope of work..." },
          { id: "var_p7", tenantId, createdAt, updatedAt: createdAt, name: "deliverables", label: "Deliverables", type: "richtext", required: true },
          { id: "var_p8", tenantId, createdAt, updatedAt: createdAt, name: "start_date", label: "Start Date", type: "date", required: true },
          { id: "var_p9", tenantId, createdAt, updatedAt: createdAt, name: "end_date", label: "End Date", type: "date", required: true },
          { id: "var_p10", tenantId, createdAt, updatedAt: createdAt, name: "milestones", label: "Key Milestones", type: "text", required: false },
          { id: "var_p11", tenantId, createdAt, updatedAt: createdAt, name: "pricing_rows", label: "Pricing Table Rows", type: "richtext", required: true, placeholder: "| Service | Description | Price |\n|---------|-------------|-------|" },
          { id: "var_p12", tenantId, createdAt, updatedAt: createdAt, name: "total_amount", label: "Total Amount", type: "currency", required: true },
          { id: "var_p13", tenantId, createdAt, updatedAt: createdAt, name: "payment_terms", label: "Payment Terms", type: "text", required: true, defaultValue: "Net 30" },
          { id: "var_p14", tenantId, createdAt, updatedAt: createdAt, name: "terms_and_conditions", label: "Terms and Conditions", type: "richtext", required: false },
          { id: "var_p15", tenantId, createdAt, updatedAt: createdAt, name: "contact_email", label: "Contact Email", type: "text", required: true, defaultValue: "sales@example.com" },
          { id: "var_p16", tenantId, createdAt, updatedAt: createdAt, name: "company_email", label: "Company Email", type: "text", required: true, defaultValue: "info@example.com" },
          { id: "var_p17", tenantId, createdAt, updatedAt: createdAt, name: "company_phone", label: "Company Phone", type: "text", required: false },
          { id: "var_p18", tenantId, createdAt, updatedAt: createdAt, name: "company_address", label: "Company Address", type: "text", required: false }
        ],
        notes: "Comprehensive service proposal with pricing table support",
        createdBy: "seed"
      }],
      metadata: { author: "TemplateOS Team", style: "professional", format: "markdown" },
      createdBy: "seed",
      publishedAt: createdAt
    },
    {
      id: "tpl_landing_page",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "saas-landing-page",
      name: "SaaS Landing Page",
      description: "Modern SaaS product landing page template with hero, features, and CTA sections",
      categoryId: "cat_website",
      type: "website",
      status: "published",
      tags: ["saas", "landing-page", "marketing", "product"],
      activeVersion: 1,
      versions: [{
        id: "tplv_landing_1",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        version: 1,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{page_title}} | {{product_name}}</title>
    <meta name="description" content="{{meta_description}}">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; color: #333; }
        .hero { background: linear-gradient(135deg, {{primary_color}}, {{secondary_color}}); color: white; padding: 80px 20px; text-align: center; }
        .hero h1 { font-size: 48px; margin-bottom: 20px; }
        .hero p { font-size: 20px; opacity: 0.9; max-width: 600px; margin: 0 auto 30px; }
        .cta-button { background: white; color: {{primary_color}}; padding: 15px 40px; border: none; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; }
        .features { padding: 60px 20px; background: #f9f9f9; }
        .features h2 { text-align: center; margin-bottom: 40px; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; }
        .feature-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .pricing { padding: 60px 20px; text-align: center; }
        .pricing h2 { margin-bottom: 40px; }
        .pricing-card { border: 2px solid {{primary_color}}; border-radius: 12px; padding: 40px; max-width: 400px; margin: 0 auto; }
        .price { font-size: 48px; color: {{primary_color}}; font-weight: bold; }
        .cta-section { background: {{primary_color}}; color: white; padding: 60px 20px; text-align: center; }
    </style>
</head>
<body>
    <section class="hero">
        <h1>{{hero_headline}}</h1>
        <p>{{hero_subheadline}}</p>
        <a href="{{cta_url}}" class="cta-button">{{cta_text}}</a>
    </section>
    
    <section class="features">
        <h2>{{features_headline}}</h2>
        <div class="feature-grid">
            {{feature_cards}}
        </div>
    </section>
    
    <section class="pricing">
        <h2>{{pricing_headline}}</h2>
        <div class="pricing-card">
            <h3>{{plan_name}}</h3>
            <div class="price">{{plan_price}}</div>
            <p>{{plan_description}}</p>
            <a href="{{cta_url}}" class="cta-button">Get Started</a>
        </div>
    </section>
    
    <section class="cta-section">
        <h2>{{final_cta_headline}}</h2>
        <p>{{final_cta_text}}</p>
        <a href="{{cta_url}}" class="cta-button">Start Free Trial</a>
    </section>
</body>
</html>`,
        variables: [
          { id: "var_lp1", tenantId, createdAt, updatedAt: createdAt, name: "page_title", label: "Page Title", type: "text", required: true, placeholder: "Free AI Audit Tool" },
          { id: "var_lp2", tenantId, createdAt, updatedAt: createdAt, name: "product_name", label: "Product Name", type: "text", required: true, defaultValue: "APPNEURAL" },
          { id: "var_lp3", tenantId, createdAt, updatedAt: createdAt, name: "meta_description", label: "Meta Description", type: "text", required: true, placeholder: "Free AI-powered audit tool for your business" },
          { id: "var_lp4", tenantId, createdAt, updatedAt: createdAt, name: "primary_color", label: "Primary Color", type: "color", required: true, defaultValue: "#6366f1" },
          { id: "var_lp5", tenantId, createdAt, updatedAt: createdAt, name: "secondary_color", label: "Secondary Color", type: "color", required: true, defaultValue: "#8b5cf6" },
          { id: "var_lp6", tenantId, createdAt, updatedAt: createdAt, name: "hero_headline", label: "Hero Headline", type: "text", required: true, placeholder: "AI-Powered Business Audit in Minutes" },
          { id: "var_lp7", tenantId, createdAt, updatedAt: createdAt, name: "hero_subheadline", label: "Hero Subheadline", type: "text", required: true, placeholder: "Get actionable insights for your business with our free AI audit tool" },
          { id: "var_lp8", tenantId, createdAt, updatedAt: createdAt, name: "cta_text", label: "CTA Button Text", type: "text", required: true, defaultValue: "Start Free Audit" },
          { id: "var_lp9", tenantId, createdAt, updatedAt: createdAt, name: "cta_url", label: "CTA URL", type: "url", required: true, placeholder: "https://app.example.com/audit" },
          { id: "var_lp10", tenantId, createdAt, updatedAt: createdAt, name: "features_headline", label: "Features Headline", type: "text", required: true, defaultValue: "Why Choose Us" },
          { id: "var_lp11", tenantId, createdAt, updatedAt: createdAt, name: "feature_cards", label: "Feature Cards HTML", type: "richtext", required: true },
          { id: "var_lp12", tenantId, createdAt, updatedAt: createdAt, name: "pricing_headline", label: "Pricing Headline", type: "text", required: true, defaultValue: "Simple Pricing" },
          { id: "var_lp13", tenantId, createdAt, updatedAt: createdAt, name: "plan_name", label: "Plan Name", type: "text", required: true, defaultValue: "Pro Plan" },
          { id: "var_lp14", tenantId, createdAt, updatedAt: createdAt, name: "plan_price", label: "Plan Price", type: "text", required: true, defaultValue: "$29/mo" },
          { id: "var_lp15", tenantId, createdAt, updatedAt: createdAt, name: "plan_description", label: "Plan Description", type: "text", required: true },
          { id: "var_lp16", tenantId, createdAt, updatedAt: createdAt, name: "final_cta_headline", label: "Final CTA Headline", type: "text", required: true },
          { id: "var_lp17", tenantId, createdAt, updatedAt: createdAt, name: "final_cta_text", label: "Final CTA Text", type: "text", required: true }
        ],
        notes: "Modern responsive landing page with CSS variables for theming",
        createdBy: "seed"
      }],
      metadata: { author: "TemplateOS Team", format: "html", style: "modern" },
      createdBy: "seed",
      publishedAt: createdAt
    },
    {
      id: "tpl_invoice_reminder_workflow",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice-reminder-workflow",
      name: "Invoice Reminder Workflow",
      description: "Automated workflow for sending invoice reminders at scheduled intervals",
      categoryId: "cat_workflow",
      type: "workflow",
      status: "published",
      tags: ["invoice", "reminder", "automation", "billing"],
      activeVersion: 1,
      versions: [{
        id: "tplv_workflow_1",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        version: 1,
        content: `# Invoice Reminder Workflow

## Trigger
- **Event:** Invoice becomes overdue by {{days_overdue}} days
- **Frequency:** Every {{reminder_frequency}} days until paid or {{max_reminders}} reminders sent

## Steps

### Step 1: Check Invoice Status
- Query: Invoice status = 'overdue'
- Compare due_date with current_date
- If overdue by {{days_overdue}}+ days, proceed

### Step 2: Send Reminder Email
- Template: {{email_template_id}}
- Variables:
  - {{customer_name}}
  - {{invoice_number}}
  - {{amount_due}}
  - {{due_date}}
  - {{payment_link}}
- Wait for: Immediate send

### Step 3: Wait Period
- Duration: {{reminder_frequency}} days
- Check: Has invoice been paid?

### Step 4: Escalation (Optional)
- If {{escalation_days}} days overdue:
  - Send to collections team
  - Notify account manager
  - Create task in CRM

### Step 5: Final Reminder
- If invoice still unpaid:
  - Send final notice with late fee warning
  - CC: collections@{{company_domain}}

## Success Criteria
- Invoice marked as paid, OR
- {{max_reminders}} reminders sent, OR
- Manual intervention required

## Notifications
- Log all reminder sends
- Track open/click rates if available
- Alert on payment received`,
        variables: [
          { id: "var_wf1", tenantId, createdAt, updatedAt: createdAt, name: "days_overdue", label: "Days Overdue to Trigger", type: "number", required: true, defaultValue: "1" },
          { id: "var_wf2", tenantId, createdAt, updatedAt: createdAt, name: "reminder_frequency", label: "Reminder Frequency (days)", type: "number", required: true, defaultValue: "7" },
          { id: "var_wf3", tenantId, createdAt, updatedAt: createdAt, name: "max_reminders", label: "Maximum Reminders", type: "number", required: true, defaultValue: "3" },
          { id: "var_wf4", tenantId, createdAt, updatedAt: createdAt, name: "email_template_id", label: "Email Template ID", type: "text", required: true },
          { id: "var_wf5", tenantId, createdAt, updatedAt: createdAt, name: "escalation_days", label: "Escalation After Days", type: "number", required: false, defaultValue: "30" },
          { id: "var_wf6", tenantId, createdAt, updatedAt: createdAt, name: "company_domain", label: "Company Domain", type: "text", required: false, defaultValue: "example.com" }
        ],
        notes: "Configurable invoice reminder automation workflow",
        createdBy: "seed"
      }],
      metadata: { author: "TemplateOS Team", type: "markdown", category: "billing" },
      createdBy: "seed",
      publishedAt: createdAt
    },
    {
      id: "tpl_resume_review_prompt",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "resume-review-prompt",
      name: "Resume Review Prompt",
      description: "AI prompt template for analyzing and providing feedback on resumes",
      categoryId: "cat_prompt",
      type: "prompt",
      status: "published",
      tags: ["resume", "career", "ai", "feedback", "analysis"],
      activeVersion: 1,
      versions: [{
        id: "tplv_prompt_1",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        version: 1,
        content: `You are an expert career coach and resume reviewer with over 15 years of experience helping professionals land their dream roles.

## Resume to Review:
{{resume_text}}

## Target Role (if specified):
{{target_role}}

## Review Focus Areas:
{{review_focus}}

## Instructions:
1. Analyze the resume structure, formatting, and content
2. Evaluate the strength of the professional summary
3. Assess work experience descriptions for impact
4. Review skills section for relevance and completeness
5. Check for ATS (Applicant Tracking System) compatibility
6. Identify strengths and areas for improvement

## Output Format:
Provide your analysis in the following sections:

### Overall Score: X/10
Brief overall assessment of the resume's effectiveness.

### Strengths
- List 3-5 specific strengths with examples from the resume

### Areas for Improvement
- List 3-5 specific improvement areas with actionable suggestions

### ATS Compatibility
- Score and specific recommendations for ATS optimization

### Tailored Suggestions for {{target_role}}
- Specific recommendations for the target role

### Suggested Keywords
- Important keywords for ATS and recruiter visibility

### Final Recommendations
- Top 3 priority actions to improve this resume

## Tone:
- Constructive and encouraging
- Specific and actionable
- Professional yet supportive`,
        variables: [
          { id: "var_pr1", tenantId, createdAt, updatedAt: createdAt, name: "resume_text", label: "Resume Text", type: "richtext", required: true, placeholder: "Paste the full resume text here..." },
          { id: "var_pr2", tenantId, createdAt, updatedAt: createdAt, name: "target_role", label: "Target Role", type: "text", required: false, placeholder: "Senior Software Engineer" },
          { id: "var_pr3", tenantId, createdAt, updatedAt: createdAt, name: "review_focus", label: "Review Focus Areas", type: "text", required: false, defaultValue: "General career advancement" }
        ],
        notes: "Comprehensive AI resume review prompt with structured output",
        createdBy: "seed"
      }],
      metadata: { author: "TemplateOS Team", type: "system-prompt", model: "gpt-4" },
      createdBy: "seed",
      publishedAt: createdAt
    },
    {
      id: "tpl_training_certificate",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "training-certificate",
      name: "Training Completion Certificate",
      description: "Professional certificate template for training program completions",
      categoryId: "cat_document",
      type: "document",
      status: "published",
      tags: ["certificate", "training", "completion", "education"],
      activeVersion: 1,
      versions: [{
        id: "tplv_cert_1",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        version: 1,
        content: `┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     CERTIFICATE OF COMPLETION               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   This is to certify that                                   │
│                                                             │
│                    {{student_name}}                         │
│                                                             │
│   has successfully completed the                             │
│                                                             │
│                  {{course_name}}                            │
│                                                             │
│   on {{completion_date}}                                    │
│                                                             │
│   Duration: {{course_duration}}                             │
│   Score: {{achievement_score}}                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Certificate ID: {{certificate_id}}                         │
│   Verification: {{verification_url}}                        │
│                                                             │
│   Trainer: {{trainer_name}}                                 │
│   Organization: {{organization_name}}                        │
│                                                             │
│   {{organization_logo}}                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘`,
        variables: [
          { id: "var_c1", tenantId, createdAt, updatedAt: createdAt, name: "student_name", label: "Student Name", type: "text", required: true, placeholder: "John Doe" },
          { id: "var_c2", tenantId, createdAt, updatedAt: createdAt, name: "course_name", label: "Course Name", type: "text", required: true, placeholder: "Advanced Machine Learning" },
          { id: "var_c3", tenantId, createdAt, updatedAt: createdAt, name: "completion_date", label: "Completion Date", type: "date", required: true },
          { id: "var_c4", tenantId, createdAt, updatedAt: createdAt, name: "course_duration", label: "Course Duration", type: "text", required: false, placeholder: "40 hours" },
          { id: "var_c5", tenantId, createdAt, updatedAt: createdAt, name: "achievement_score", label: "Achievement Score", type: "text", required: false, placeholder: "95%" },
          { id: "var_c6", tenantId, createdAt, updatedAt: createdAt, name: "certificate_id", label: "Certificate ID", type: "text", required: true },
          { id: "var_c7", tenantId, createdAt, updatedAt: createdAt, name: "verification_url", label: "Verification URL", type: "url", required: false },
          { id: "var_c8", tenantId, createdAt, updatedAt: createdAt, name: "trainer_name", label: "Trainer Name", type: "text", required: true },
          { id: "var_c9", tenantId, createdAt, updatedAt: createdAt, name: "organization_name", label: "Organization Name", type: "text", required: true, defaultValue: "APPNEURAL" },
          { id: "var_c10", tenantId, createdAt, updatedAt: createdAt, name: "organization_logo", label: "Organization Logo", type: "text", required: false, placeholder: "[LOGO]" }
        ],
        notes: "Professional training completion certificate template",
        createdBy: "seed"
      }],
      metadata: { author: "TemplateOS Team", format: "text-art", style: "formal" },
      createdBy: "seed",
      publishedAt: createdAt
    }
  );

  state.events.push({
    id: "evt_seed",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "templateos.seeded",
    source: "TemplateOS",
    data: { message: "TemplateOS demo data seeded", templateCount: state.templates.length, categoryCount: state.categories.length }
  });

  return state;
}
