// RevvelPress Subscription Tiers
// Pricing based on usage volume (adapted from page-based model for academic content)

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    monthlyTokens: 50,
    priceMonthly: 0,
    features: [
      "5 papers",
      "50 AI tokens/month",
      "Basic content generation",
      "PDF export",
    ],
  },
  starter: {
    name: "Starter",
    monthlyTokens: 500,
    priceMonthly: 1499, // $14.99
    stripePriceId: "price_starter_monthly",
    features: [
      "25 papers",
      "500 AI tokens/month",
      "All content types",
      "Zenodo publishing",
      "Content calendar",
      "Priority support",
    ],
  },
  professional: {
    name: "Professional",
    monthlyTokens: 2000,
    priceMonthly: 3999, // $39.99
    stripePriceId: "price_professional_monthly",
    features: [
      "Unlimited papers",
      "2,000 AI tokens/month",
      "All content types",
      "Zenodo + SSRN publishing",
      "Content calendar",
      "Bulk generation",
      "API access",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    monthlyTokens: 10000,
    priceMonthly: 9999, // $99.99
    stripePriceId: "price_enterprise_monthly",
    features: [
      "Unlimited everything",
      "10,000 AI tokens/month",
      "Custom AI models",
      "Team collaboration",
      "White-label exports",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
} as const;

// Token overage pricing: $0.02 per token after monthly allowance
export const TOKEN_OVERAGE_PRICE_CENTS = 2;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
