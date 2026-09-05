export type BillingInterval = "monthly" | "yearly";

export type PlanId = "starter" | "pro" | "advanced";

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  priceIds: {
    monthly: string;
    yearly: string;
  };
  features: string[];
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For individuals getting started with provider search.",
    monthlyPrice: 10,
    yearlyPrice: 100,
    priceIds: {
      monthly: "pri_01m1q4r5gpfpcm0dh1wq5zhere",
      yearly: "pri_01m1q4y6am7h0wkccee4amddn1",
    },
    features: [
      "Basic Provider Searches",
      "Doctor & Hospital Directories",
      "Public Specialty Filters",
      "Save up to 25 favorites",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For power users and clinical researchers.",
    monthlyPrice: 40,
    yearlyPrice: 400,
    priceIds: {
      monthly: "pri_01m1q5cqcd00vdpcb8tpmr8sb9",
      yearly: "pri_01m1q5h382tj3e3xy1j8pr589w",
    },
    features: [
      "Advanced Search Filters",
      "Detailed NPI & License Data",
      "Unlimited Saved Lists",
      "Export Search Results (CSV)",
      "Priority Email Support",
    ],
    popular: true,
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "For teams building healthcare data workflows.",
    monthlyPrice: 120,
    yearlyPrice: 1200,
    priceIds: {
      monthly: "pri_01m1q5v0eq8fz00wbmtb1vpn8j",
      yearly: "pri_01m1q5y40qppmpwenvtqw5kyva",
    },
    features: [
      "Everything in Pro",
      "Full REST API Access",
      "50,000 API Requests/mo",
      "Real-time NPI Data Sync",
      "Priority Developer Support",
    ],
  },
];

export function getPlanPriceId(plan: PricingPlan, interval: BillingInterval): string {
  return interval === "monthly" ? plan.priceIds.monthly : plan.priceIds.yearly;
}
