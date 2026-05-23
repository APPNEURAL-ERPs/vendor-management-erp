export interface ApiDoc {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  endpoints: ApiEndpoint[];
  models: Record<string, unknown>;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  summary: string;
  description?: string;
  parameters?: ApiParameter[];
  body?: ApiBody;
  response: ApiResponse;
  example?: unknown;
}

export interface ApiParameter {
  name: string;
  in: "path" | "query" | "header";
  required: boolean;
  type: string;
  description?: string;
  example?: unknown;
}

export interface ApiBody {
  type: string;
  required: boolean;
  properties: Record<string, unknown>;
  example?: unknown;
}

export interface ApiResponse {
  status: number;
  description: string;
  schema: unknown;
  example?: unknown;
}

export const apiDocs = {
  title: "BillingOS API",
  version: "1.0.0",
  description: "BillingOS: subscription, plan, invoice, payment, usage metering, credits, renewals, refunds, dunning, tax, and billing automation",
  baseUrl: "/v1/billing",
  endpoints: [
    {
      method: "GET",
      path: "/health",
      summary: "Health check",
      description: "Check if BillingOS is running",
      response: { status: 200, description: "Health status", schema: { type: "object" }, example: { status: "ok", timestamp: "2024-01-01T00:00:00Z" } }
    },
    {
      method: "GET",
      path: "/docs",
      summary: "API documentation",
      description: "Get API documentation",
      response: { status: 200, description: "API docs", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/overview",
      summary: "Billing overview",
      description: "Get billing overview metrics",
      response: { status: 200, description: "Billing overview", schema: { type: "object" }, example: { accounts: { total: 100, active: 80, trial: 10, suspended: 5 }, subscriptions: { total: 85, active: 70, trial: 10, pastDue: 3, cancelled: 2 }, invoices: { total: 500, pending: 50, paid: 440, overdue: 10 }, payments: { total: 450, successful: 440, failed: 8, pending: 2 }, revenue: { mrr: 50000, arr: 600000, mtd: 15000, ytd: 180000 }, usage: { total: 10000, billable: 9500 }, credits: { total: 50000, issued: 45000, used: 40000 }, refunds: { total: 20, requested: 5, processed: 15 } } }
    },
    {
      method: "POST",
      path: "/accounts",
      summary: "Create billing account",
      description: "Create a new billing account",
      body: {
        type: "BillingAccount",
        required: true,
        properties: { customerId: { type: "string" }, customerName: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, companyName: { type: "string" }, currency: { type: "string" } },
        example: { customerId: "cust_123", customerName: "John Doe", email: "john@example.com", currency: "INR" }
      },
      response: { status: 201, description: "Billing account created", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/accounts",
      summary: "List billing accounts",
      description: "Get all billing accounts",
      parameters: [
        { name: "status", in: "query", required: false, type: "string", description: "Filter by status" },
        { name: "search", in: "query", required: false, type: "string", description: "Search by name or email" }
      ],
      response: { status: 200, description: "Billing accounts list", schema: { type: "array" } }
    },
    {
      method: "GET",
      path: "/accounts/:id",
      summary: "Get billing account",
      description: "Get billing account by ID",
      parameters: [
        { name: "id", in: "path", required: true, type: "string", description: "Billing account ID" }
      ],
      response: { status: 200, description: "Billing account details", schema: { type: "object" } }
    },
    {
      method: "PATCH",
      path: "/accounts/:id",
      summary: "Update billing account",
      description: "Update billing account details",
      parameters: [
        { name: "id", in: "path", required: true, type: "string", description: "Billing account ID" }
      ],
      body: {
        type: "BillingAccount",
        required: true,
        properties: { customerName: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, status: { type: "string" } },
        example: { customerName: "John Updated" }
      },
      response: { status: 200, description: "Billing account updated", schema: { type: "object" } }
    },
    {
      method: "POST",
      path: "/plans",
      summary: "Create pricing plan",
      description: "Create a new pricing plan",
      body: {
        type: "PricingPlan",
        required: true,
        properties: { key: { type: "string" }, name: { type: "string" }, product: { type: "string" }, price: { type: "number" }, billingCycle: { type: "string" }, features: { type: "array" }, limits: { type: "array" } },
        example: { key: "pro_monthly", name: "Professional Monthly", product: "CareerOS", price: 999, billingCycle: "monthly" }
      },
      response: { status: 201, description: "Pricing plan created", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/plans",
      summary: "List pricing plans",
      description: "Get all pricing plans",
      parameters: [
        { name: "status", in: "query", required: false, type: "string", description: "Filter by status" },
        { name: "product", in: "query", required: false, type: "string", description: "Filter by product" }
      ],
      response: { status: 200, description: "Pricing plans list", schema: { type: "array" } }
    },
    {
      method: "GET",
      path: "/plans/:id",
      summary: "Get pricing plan",
      description: "Get pricing plan by ID",
      parameters: [
        { name: "id", in: "path", required: true, type: "string", description: "Pricing plan ID" }
      ],
      response: { status: 200, description: "Pricing plan details", schema: { type: "object" } }
    },
    {
      method: "POST",
      path: "/subscriptions",
      summary: "Create subscription",
      description: "Create a new subscription",
      body: {
        type: "Subscription",
        required: true,
        properties: { billingAccountId: { type: "string" }, planId: { type: "string" }, type: { type: "string" }, billingCycle: { type: "string" }, seatCount: { type: "number" }, autoRenew: { type: "boolean" } },
        example: { billingAccountId: "acc_123", planId: "plan_456", type: "monthly", billingCycle: "monthly", seatCount: 5, autoRenew: true }
      },
      response: { status: 201, description: "Subscription created", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/subscriptions",
      summary: "List subscriptions",
      description: "Get all subscriptions",
      parameters: [
        { name: "status", in: "query", required: false, type: "string", description: "Filter by status" },
        { name: "billingAccountId", in: "query", required: false, type: "string", description: "Filter by billing account" }
      ],
      response: { status: 200, description: "Subscriptions list", schema: { type: "array" } }
    },
    {
      method: "GET",
      path: "/subscriptions/:id",
      summary: "Get subscription",
      description: "Get subscription by ID",
      parameters: [
        { name: "id", in: "path", required: true, type: "string", description: "Subscription ID" }
      ],
      response: { status: 200, description: "Subscription details", schema: { type: "object" } }
    },
    {
      method: "PATCH",
      path: "/subscriptions/:id",
      summary: "Update subscription",
      description: "Update subscription details",
      parameters: [
        { name: "id", in: "path", required: true, type: "string", description: "Subscription ID" }
      ],
      body: {
        type: "Subscription",
        required: true,
        properties: { status: { type: "string" }, seatCount: { type: "number" }, autoRenew: { type: "boolean" } },
        example: { status: "active" }
      },
      response: { status: 200, description: "Subscription updated", schema: { type: "object" } }
    },
    {
      method: "POST",
      path: "/invoices",
      summary: "Create invoice",
      description: "Create a new invoice",
      body: {
        type: "Invoice",
        required: true,
        properties: { billingAccountId: { type: "string" }, subscriptionId: { type: "string" }, type: { type: "string" }, items: { type: "array" }, dueDate: { type: "string" } },
        example: { billingAccountId: "acc_123", type: "subscription", items: [{ description: "Pro Plan - Monthly", quantity: 1, unitPrice: 999, totalAmount: 999 }] }
      },
      response: { status: 201, description: "Invoice created", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/invoices",
      summary: "List invoices",
      description: "Get all invoices",
      parameters: [
        { name: "status", in: "query", required: false, type: "string", description: "Filter by status" },
        { name: "billingAccountId", in: "query", required: false, type: "string", description: "Filter by billing account" }
      ],
      response: { status: 200, description: "Invoices list", schema: { type: "array" } }
    },
    {
      method: "GET",
      path: "/invoices/:id",
      summary: "Get invoice",
      description: "Get invoice by ID",
      parameters: [
        { name: "id", in: "path", required: true, type: "string", description: "Invoice ID" }
      ],
      response: { status: 200, description: "Invoice details", schema: { type: "object" } }
    },
    {
      method: "POST",
      path: "/payments",
      summary: "Create payment",
      description: "Record a new payment",
      body: {
        type: "Payment",
        required: true,
        properties: { invoiceId: { type: "string" }, billingAccountId: { type: "string" }, amount: { type: "number" }, currency: { type: "string" }, gateway: { type: "string" }, paymentMethodId: { type: "string" } },
        example: { invoiceId: "inv_789", billingAccountId: "acc_123", amount: 999, currency: "INR", gateway: "razorpay" }
      },
      response: { status: 201, description: "Payment created", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/payments",
      summary: "List payments",
      description: "Get all payments",
      parameters: [
        { name: "status", in: "query", required: false, type: "string", description: "Filter by status" },
        { name: "billingAccountId", in: "query", required: false, type: "string", description: "Filter by billing account" }
      ],
      response: { status: 200, description: "Payments list", schema: { type: "array" } }
    },
    {
      method: "POST",
      path: "/usage",
      summary: "Record usage",
      description: "Record usage event",
      body: {
        type: "UsageRecord",
        required: true,
        properties: { tenantId: { type: "string" }, billingAccountId: { type: "string" }, eventType: { type: "string" }, unit: { type: "string" }, quantity: { type: "number" }, unitPrice: { type: "number" } },
        example: { tenantId: "tenant_123", billingAccountId: "acc_123", eventType: "ai_tokens", unit: "tokens", quantity: 1000, unitPrice: 0.001 }
      },
      response: { status: 201, description: "Usage recorded", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/usage/:billingAccountId",
      summary: "Get usage records",
      description: "Get usage records for a billing account",
      parameters: [
        { name: "billingAccountId", in: "path", required: true, type: "string", description: "Billing account ID" },
        { name: "startDate", in: "query", required: false, type: "string", description: "Start date filter" },
        { name: "endDate", in: "query", required: false, type: "string", description: "End date filter" }
      ],
      response: { status: 200, description: "Usage records list", schema: { type: "array" } }
    },
    {
      method: "POST",
      path: "/credits/add",
      summary: "Add credits",
      description: "Add credits to wallet",
      body: {
        type: "object",
        required: true,
        properties: { billingAccountId: { type: "string" }, type: { type: "string" }, amount: { type: "number" }, description: { type: "string" } },
        example: { billingAccountId: "acc_123", type: "ai_credits", amount: 1000, description: "Purchased AI credits" }
      },
      response: { status: 201, description: "Credits added", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/credits/:billingAccountId",
      summary: "Get credit balance",
      description: "Get credit wallet balance",
      parameters: [
        { name: "billingAccountId", in: "path", required: true, type: "string", description: "Billing account ID" },
        { name: "type", in: "query", required: false, type: "string", description: "Wallet type filter" }
      ],
      response: { status: 200, description: "Credit balance", schema: { type: "object" } }
    },
    {
      method: "POST",
      path: "/refunds",
      summary: "Create refund",
      description: "Create a refund request",
      body: {
        type: "Refund",
        required: true,
        properties: { paymentId: { type: "string" }, amount: { type: "number" }, reason: { type: "string" }, description: { type: "string" } },
        example: { paymentId: "pay_456", amount: 999, reason: "customer_cancellation", description: "Customer requested cancellation" }
      },
      response: { status: 201, description: "Refund created", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/refunds",
      summary: "List refunds",
      description: "Get all refunds",
      parameters: [
        { name: "status", in: "query", required: false, type: "string", description: "Filter by status" }
      ],
      response: { status: 200, description: "Refunds list", schema: { type: "array" } }
    },
    {
      method: "POST",
      path: "/coupons",
      summary: "Create coupon",
      description: "Create a new coupon",
      body: {
        type: "Coupon",
        required: true,
        properties: { code: { type: "string" }, name: { type: "string" }, type: { type: "string" }, value: { type: "number" }, validUntil: { type: "string" }, applicablePlans: { type: "array" } },
        example: { code: "SAVE50", name: "50% Off", type: "percentage", value: 50, applicablePlans: ["pro_monthly", "business_monthly"] }
      },
      response: { status: 201, description: "Coupon created", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/coupons/:code",
      summary: "Validate coupon",
      description: "Validate coupon code",
      parameters: [
        { name: "code", in: "path", required: true, type: "string", description: "Coupon code" }
      ],
      response: { status: 200, description: "Coupon validation result", schema: { type: "object" } }
    },
    {
      method: "POST",
      path: "/dunning",
      summary: "Start dunning",
      description: "Start dunning process for failed payment",
      body: {
        type: "object",
        required: true,
        properties: { subscriptionId: { type: "string" }, billingAccountId: { type: "string" } },
        example: { subscriptionId: "sub_123", billingAccountId: "acc_123" }
      },
      response: { status: 201, description: "Dunning started", schema: { type: "object" } }
    },
    {
      method: "GET",
      path: "/analytics",
      summary: "Billing analytics",
      description: "Get billing analytics",
      parameters: [
        { name: "startDate", in: "query", required: false, type: "string", description: "Start date" },
        { name: "endDate", in: "query", required: false, type: "string", description: "End date" }
      ],
      response: { status: 200, description: "Billing analytics", schema: { type: "object" } }
    }
  ],
  models: {}
};
