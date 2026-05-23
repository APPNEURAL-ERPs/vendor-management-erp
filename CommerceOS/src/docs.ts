export function docs() {
  return {
    name: "CommerceOS",
    version: "1.0.0",
    description:
      "CommerceOS: Ecommerce, retail, product catalog, inventory, orders, payments, subscriptions, and commerce growth. Powers product sales, cart management, checkout, order processing, payment tracking, refunds, and customer management.",
    auth: {
      headers: {
        "x-role": "owner | admin | commerce_manager | order_processor | inventory_manager | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      product: "A sellable item with variants, pricing, inventory, and metadata. Can be physical, digital, service, subscription, bundle, course, or downloadable.",
      category: "Organizational unit for grouping products with hierarchical support.",
      cart: "Temporary shopping cart that holds items, calculates totals, and applies discounts.",
      order: "Confirmed purchase containing items, customer info, shipping details, and payment reference.",
      payment: "Transaction record tracking payment status for an order.",
      refund: "Request and processing of money back to customer.",
      subscription: "Recurring billing arrangement for products/services.",
      checkout: "Session that bridges cart to order with address and payment selection.",
      coupon: "Discount code with rules for minimum order, usage limits, and validity."
    },
    examples: {
      createProduct: {
        method: "POST",
        path: "/commerceos/products",
        headers: { "x-role": "commerce_manager" },
        body: {
          key: "ai_resume_review",
          name: "AI Resume Review",
          type: "service",
          basePrice: 999,
          categoryId: "cat_digital_services",
          tags: ["resume", "career", "ai"]
        }
      },
      addToCart: {
        method: "POST",
        path: "/commerceos/carts/:id/items",
        headers: { "x-role": "viewer" },
        body: { productId: "prod_resume_review", variantId: "prod_resume_review_std", quantity: 1 }
      },
      applyCoupon: {
        method: "POST",
        path: "/commerceos/carts/:id/coupon",
        headers: { "x-role": "viewer" },
        body: { code: "WELCOME10" }
      },
      checkout: {
        method: "POST",
        path: "/commerceos/checkout/:id/process",
        headers: { "x-role": "commerce_manager" },
        body: { customerEmail: "customer@example.com", method: "card", gateway: "razorpay" }
      },
      processPayment: {
        method: "POST",
        path: "/commerceos/payments/:id/process",
        headers: { "x-role": "commerce_manager" },
        body: { status: "paid", transactionId: "txn_abc123" }
      },
      createOrder: {
        method: "POST",
        path: "/commerceos/orders",
        headers: { "x-role": "order_processor" },
        body: {
          customerEmail: "john@example.com",
          items: [{ productId: "prod_bundle", quantity: 1, unitPrice: 4999 }],
          total: 4999
        }
      },
      updateOrderStatus: {
        method: "PATCH",
        path: "/commerceos/orders/:id/status",
        headers: { "x-role": "order_processor" },
        body: { status: "shipped" }
      },
      processRefund: {
        method: "POST",
        path: "/commerceos/refunds/:id/process",
        headers: { "x-role": "commerce_manager" },
        body: { status: "refunded" }
      },
      createSubscription: {
        method: "POST",
        path: "/commerceos/subscriptions",
        headers: { "x-role": "commerce_manager" },
        body: {
          customerId: "cust_abc",
          productId: "prod_monthly_service",
          billingCycle: "monthly",
          amount: 999
        }
      },
      createReview: {
        method: "POST",
        path: "/commerceos/reviews",
        headers: { "x-role": "viewer" },
        body: { productId: "prod_resume_review", rating: 5, title: "Excellent service!", content: "..." }
      }
    },
    commerceWorkflows: {
      simpleSale: "Product → Cart → Checkout → Payment → Order → Delivery",
      digitalProduct: "Product → Cart → Checkout → Payment → Download Link",
      serviceProduct: "Product → Cart → Checkout → Payment → Order → Service Delivery",
      subscriptionSale: "Product → Cart → Checkout → Payment → Subscription → Recurring Billing",
      refundFlow: "Order → Refund Request → Approval → Refund Processing → Refund Complete",
      bundleSale: "Bundle Product → Cart → Checkout (with individual items tracked) → Payment → Order"
    },
    productTypes: {
      physical: "Physical goods requiring shipping and inventory tracking",
      digital: "Downloadable files, templates, software licenses",
      service: "Consulting, reviews, professional services",
      subscription: "Recurring billing for ongoing access or deliveries",
      bundle: "Package of multiple products at discounted price",
      course: "Educational content with video, documents, and access control",
      downloadable: "Files with license keys and download limits",
      marketplace: "Products sold by third-party vendors"
    },
    orderStatuses: {
      pending: "Order created, awaiting payment",
      confirmed: "Payment authorized or received",
      processing: "Order being prepared",
      packed: "Items packed and ready for shipment",
      shipped: "Handed to delivery carrier",
      delivered: "Successfully delivered to customer",
      cancelled: "Order cancelled before completion",
      returned: "Items returned by customer",
      refunded: "Money returned to customer",
      failed: "Payment failed or order could not be completed"
    },
    paymentStatuses: {
      pending: "Awaiting payment initiation",
      authorized: "Funds reserved but not captured",
      paid: "Payment successfully completed",
      failed: "Payment attempt failed",
      refunded: "Full refund processed",
      partially_refunded: "Partial refund processed",
      chargeback: "Disputed by payment provider",
      cancelled: "Payment cancelled before completion"
    }
  };
}
