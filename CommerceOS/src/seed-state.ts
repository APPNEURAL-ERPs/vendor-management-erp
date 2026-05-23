import { CommerceState } from "./domain";
import { emptyState } from "./core";
import { nowIso } from "./core";

export function createSeedState(tenantId = "demo-tenant"): CommerceState {
  const state = emptyState();
  const createdAt = nowIso();

  state.categories.push(
    {
      id: "cat_digital_services",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "digital_services",
      name: "Digital Services",
      description: "Digital services and consulting",
      status: "active",
      tags: ["digital", "service"]
    },
    {
      id: "cat_courses",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "courses",
      name: "Courses",
      description: "Online courses and training",
      status: "active",
      tags: ["education", "course"]
    },
    {
      id: "cat_templates",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "templates",
      name: "Templates",
      description: "Digital templates and documents",
      status: "active",
      tags: ["digital", "template"]
    },
    {
      id: "cat_consulting",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "consulting",
      name: "Consulting",
      description: "Professional consulting services",
      status: "active",
      tags: ["service", "consulting"]
    }
  );

  state.products.push(
    {
      id: "prod_resume_review",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "resume_review",
      name: "AI Resume Review Package",
      description: "A professional resume improvement service that checks your resume against ATS, recruiter expectations, and target job roles. Includes PDF report and improvement suggestions.",
      shortDescription: "Professional AI-powered resume review and improvement service",
      type: "service",
      status: "active",
      categoryId: "cat_digital_services",
      variants: [
        {
          id: "prod_resume_review_std",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          productId: "prod_resume_review",
          sku: "RES-REV-STD",
          name: "Standard Resume Review",
          price: 999,
          costPrice: 400,
          compareAtPrice: 1499,
          inventory: 999,
          inventoryStatus: "in_stock",
          attributes: { tier: "standard", turnaround: "48h" },
          status: "active"
        },
        {
          id: "prod_resume_review_pro",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          productId: "prod_resume_review",
          sku: "RES-REV-PRO",
          name: "Professional Resume Review",
          price: 1999,
          costPrice: 800,
          compareAtPrice: 2999,
          inventory: 999,
          inventoryStatus: "in_stock",
          attributes: { tier: "professional", turnaround: "24h" },
          status: "active"
        }
      ],
      basePrice: 999,
      costPrice: 400,
      sku: "RES-REV",
      images: ["https://example.com/resume-review.jpg"],
      tags: ["resume", "career", "ai", "review"],
      metadata: { deliveryFormat: "PDF", deliveryTime: "48 hours" }
    },
    {
      id: "prod_linkedin_opt",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "linkedin_optimization",
      name: "LinkedIn Profile Optimization",
      description: "Complete LinkedIn profile optimization including headline, summary, experience descriptions, and keywords to improve visibility to recruiters.",
      shortDescription: "Boost your LinkedIn profile visibility and recruiter reach",
      type: "service",
      status: "active",
      categoryId: "cat_digital_services",
      variants: [
        {
          id: "prod_linkedin_opt_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          productId: "prod_linkedin_opt",
          sku: "LI-OPT-001",
          name: "LinkedIn Optimization",
          price: 1499,
          costPrice: 600,
          compareAtPrice: 1999,
          inventory: 999,
          inventoryStatus: "in_stock",
          attributes: {},
          status: "active"
        }
      ],
      basePrice: 1499,
      costPrice: 600,
      sku: "LI-OPT",
      images: ["https://example.com/linkedin.jpg"],
      tags: ["linkedin", "career", "optimization"],
      metadata: { deliveryFormat: "PDF + Editable", deliveryTime: "3 days" }
    },
    {
      id: "prod_career_course",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "career_masterclass",
      name: "Career Masterclass Course",
      description: "Comprehensive video course covering job search strategies, interview preparation, salary negotiation, and career growth tactics.",
      shortDescription: "Complete career growth video course with 20+ lessons",
      type: "course",
      status: "active",
      categoryId: "cat_courses",
      variants: [
        {
          id: "prod_career_course_basic",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          productId: "prod_career_course",
          sku: "CAR-CRS-BSC",
          name: "Basic Course",
          price: 2999,
          costPrice: 1200,
          compareAtPrice: 4999,
          inventory: 999,
          inventoryStatus: "in_stock",
          attributes: { access: "6 months" },
          status: "active"
        },
        {
          id: "prod_career_course_premium",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          productId: "prod_career_course",
          sku: "CAR-CRS-PRM",
          name: "Premium Course with Mentorship",
          price: 7999,
          costPrice: 3200,
          compareAtPrice: 11999,
          inventory: 999,
          inventoryStatus: "in_stock",
          attributes: { access: "Lifetime", mentorship: "included" },
          status: "active"
        }
      ],
      basePrice: 2999,
      costPrice: 1200,
      sku: "CAR-CRS",
      images: ["https://example.com/career-course.jpg"],
      tags: ["course", "career", "interview", "video"],
      metadata: { videoHours: 15, lessons: 25, downloadable: true }
    },
    {
      id: "prod_resume_template",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "resume_template_bundle",
      name: "Professional Resume Template Bundle",
      description: "Collection of 10 professionally designed resume templates in multiple formats (Word, Pages, Google Docs) with customization instructions.",
      shortDescription: "10 premium resume templates with customization guide",
      type: "digital",
      status: "active",
      categoryId: "cat_templates",
      variants: [
        {
          id: "prod_resume_template_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          productId: "prod_resume_template",
          sku: "RES-TMP-001",
          name: "Resume Template Bundle",
          price: 499,
          costPrice: 100,
          compareAtPrice: 799,
          inventory: 9999,
          inventoryStatus: "in_stock",
          attributes: { formats: "Word, Pages, Google Docs" },
          status: "active"
        }
      ],
      basePrice: 499,
      costPrice: 100,
      sku: "RES-TMP",
      images: ["https://example.com/resume-templates.jpg"],
      tags: ["template", "resume", "digital"],
      metadata: { fileSize: "50MB", downloadLimit: 5 }
    },
    {
      id: "prod_bundle_career",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "career_bundle",
      name: "Complete Career Bundle",
      description: "The ultimate career package: Resume Review + LinkedIn Optimization + Career Course + Template Bundle at a special discounted price.",
      shortDescription: "Complete career package with all services and tools",
      type: "bundle",
      status: "active",
      categoryId: "cat_digital_services",
      variants: [
        {
          id: "prod_bundle_career_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          productId: "prod_bundle_career",
          sku: "CAR-BND-001",
          name: "Career Bundle",
          price: 4999,
          costPrice: 2000,
          compareAtPrice: 7996,
          inventory: 999,
          inventoryStatus: "in_stock",
          attributes: { savings: "37%" },
          status: "active"
        }
      ],
      basePrice: 4999,
      costPrice: 2000,
      sku: "CAR-BND",
      images: ["https://example.com/bundle.jpg"],
      tags: ["bundle", "career", "complete"],
      metadata: { includesServices: ["Resume Review", "LinkedIn Optimization", "Career Course", "Templates"] }
    }
  );

  state.customers.push(
    {
      id: "cust_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      email: "john.doe@example.com",
      displayName: "John Doe",
      phone: "+91-9876543210",
      addresses: [
        {
          fullName: "John Doe",
          addressLine1: "123 Tech Park",
          addressLine2: "Whitefield",
          city: "Bangalore",
          state: "Karnataka",
          postalCode: "560048",
          country: "India",
          phone: "+91-9876543210"
        }
      ],
      defaultShippingAddressId: "0",
      defaultBillingAddressId: "0",
      status: "active",
      tags: ["premium", "referral"],
      totalOrders: 3,
      totalSpent: 10497,
      metadata: {}
    },
    {
      id: "cust_demo_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      email: "jane.smith@example.com",
      displayName: "Jane Smith",
      phone: "+91-9876543211",
      addresses: [
        {
          fullName: "Jane Smith",
          addressLine1: "456 Business Center",
          addressLine2: "MG Road",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
          phone: "+91-9876543211"
        }
      ],
      defaultShippingAddressId: "0",
      defaultBillingAddressId: "0",
      status: "active",
      tags: ["new", "course"],
      totalOrders: 1,
      totalSpent: 2999,
      metadata: {}
    }
  );

  state.carts.push(
    {
      id: "cart_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      customerId: "cust_demo_1",
      sessionId: "session_abc123",
      items: [
        {
          productId: "prod_resume_review",
          variantId: "prod_resume_review_pro",
          quantity: 1,
          unitPrice: 1999,
          totalPrice: 1999,
          metadata: {}
        }
      ],
      subtotal: 1999,
      discountAmount: 0,
      taxAmount: 360,
      shippingAmount: 0,
      total: 2359,
      status: "active"
    }
  );

  state.orders.push(
    {
      id: "ord_2024_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderNumber: "ORD-2024-001",
      customerId: "cust_demo_1",
      customerEmail: "john.doe@example.com",
      items: [
        {
          productId: "prod_resume_review",
          variantId: "prod_resume_review_pro",
          productName: "AI Resume Review Package",
          variantName: "Professional Resume Review",
          sku: "RES-REV-PRO",
          quantity: 1,
          unitPrice: 1999,
          discountAmount: 0,
          taxAmount: 360,
          totalPrice: 2359
        }
      ],
      subtotal: 1999,
      discountAmount: 0,
      taxAmount: 360,
      shippingAmount: 0,
      total: 2359,
      status: "delivered",
      shippingAddress: {
        fullName: "John Doe",
        addressLine1: "123 Tech Park",
        addressLine2: "Whitefield",
        city: "Bangalore",
        state: "Karnataka",
        postalCode: "560048",
        country: "India",
        phone: "+91-9876543210"
      },
      metadata: { deliveryCompletedAt: createdAt }
    },
    {
      id: "ord_2024_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderNumber: "ORD-2024-002",
      customerId: "cust_demo_2",
      customerEmail: "jane.smith@example.com",
      items: [
        {
          productId: "prod_career_course",
          variantId: "prod_career_course_basic",
          productName: "Career Masterclass Course",
          variantName: "Basic Course",
          sku: "CAR-CRS-BSC",
          quantity: 1,
          unitPrice: 2999,
          discountAmount: 0,
          taxAmount: 540,
          totalPrice: 3539
        }
      ],
      subtotal: 2999,
      discountAmount: 0,
      taxAmount: 540,
      shippingAmount: 0,
      total: 3539,
      status: "delivered",
      metadata: { accessGrantedAt: createdAt }
    },
    {
      id: "ord_2024_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderNumber: "ORD-2024-003",
      customerId: "cust_demo_1",
      customerEmail: "john.doe@example.com",
      items: [
        {
          productId: "prod_bundle_career",
          variantId: "prod_bundle_career_1",
          productName: "Complete Career Bundle",
          variantName: "Career Bundle",
          sku: "CAR-BND-001",
          quantity: 1,
          unitPrice: 4999,
          discountAmount: 500,
          taxAmount: 810,
          totalPrice: 5309
        }
      ],
      subtotal: 4999,
      discountAmount: 500,
      taxAmount: 810,
      shippingAmount: 0,
      total: 5309,
      status: "processing",
      metadata: {}
    }
  );

  state.payments.push(
    {
      id: "pay_2024_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderId: "ord_2024_001",
      amount: 2359,
      currency: "INR",
      method: "card",
      status: "paid",
      gateway: "razorpay",
      gatewayTransactionId: "txn_abc123",
      paidAt: createdAt,
      metadata: { cardLast4: "1234" }
    },
    {
      id: "pay_2024_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderId: "ord_2024_002",
      amount: 3539,
      currency: "INR",
      method: "upi",
      status: "paid",
      gateway: "razorpay",
      gatewayTransactionId: "txn_def456",
      paidAt: createdAt,
      metadata: { upiId: "jane@example@upi" }
    },
    {
      id: "pay_2024_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      orderId: "ord_2024_003",
      amount: 5309,
      currency: "INR",
      method: "card",
      status: "authorized",
      gateway: "razorpay",
      gatewayTransactionId: "txn_ghi789",
      metadata: { cardLast4: "5678" }
    }
  );

  state.coupons.push(
    {
      id: "coup_welcome10",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      code: "WELCOME10",
      name: "Welcome 10% Off",
      description: "10% off for new customers",
      type: "percentage",
      value: 10,
      minOrderAmount: 500,
      usageLimit: 1000,
      usedCount: 23,
      validFrom: createdAt,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      applicableCategoryIds: ["cat_digital_services", "cat_courses", "cat_templates"]
    },
    {
      id: "coup_save500",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      code: "SAVE500",
      name: "Save ₹500",
      description: "Flat ₹500 off on orders above ₹3000",
      type: "fixed_amount",
      value: 500,
      minOrderAmount: 3000,
      maxDiscountAmount: 500,
      usageLimit: 500,
      usedCount: 45,
      validFrom: createdAt,
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active"
    }
  );

  state.warehouses.push({
    id: "wh_main",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "main_warehouse",
    name: "Main Digital Warehouse",
    address: "Digital Delivery System",
    status: "active"
  });

  state.inventory.push({
    id: "inv_resume_review_std",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    productId: "prod_resume_review",
    variantId: "prod_resume_review_std",
    warehouseId: "wh_main",
    quantity: 999,
    reservedQuantity: 0,
    availableQuantity: 999,
    status: "in_stock",
    lowStockThreshold: 50,
    reorderPoint: 100
  });

  state.loyaltyPoints.push(
    {
      id: "loyalty_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      customerId: "cust_demo_1",
      balance: 500,
      lifetimeEarned: 750,
      lifetimeRedeemed: 250,
      tier: "silver"
    },
    {
      id: "loyalty_demo_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      customerId: "cust_demo_2",
      balance: 100,
      lifetimeEarned: 100,
      lifetimeRedeemed: 0,
      tier: "bronze"
    }
  );

  state.reviews.push({
    id: "review_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    productId: "prod_resume_review",
    orderId: "ord_2024_001",
    customerId: "cust_demo_1",
    rating: 5,
    title: "Excellent service!",
    content: "Got my resume reviewed within 24 hours. The suggestions were very practical and helped me land more interviews.",
    status: "approved",
    verified: true,
    helpful: 15,
    metadata: {}
  });

  state.events.push({
    id: "event_demo_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "commerce.seeded",
    source: "CommerceOS",
    data: { message: "CommerceOS demo data seeded" }
  });

  return state;
}
