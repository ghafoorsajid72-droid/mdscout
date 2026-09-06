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
      monthly: "pri_01m1w3frfzzynbj41ham3tevz9",
      yearly: "pri_01m1w3n6sztejvpmvw5jwets9x",
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
      monthly: "pri_01m1w45z6yfh7b3j7t2ej2zn01",
      yearly: "pri_01m1w48nwjqb3rb67cfat5psq2",
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
      monthly: "pri_01m1w4dcnwd7jchtrvbem36tf5",
      yearly: "pri_01m1w4gwxmpnc3wv75g05ajpg5",
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
