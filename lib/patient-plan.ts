export type PatientBillingInterval = "monthly" | "yearly";

export interface PatientPlan {
  id: "plus";
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  priceIds: {
    monthly: string;
    yearly: string;
  };
  features: string[];
}

export const PATIENT_PLAN: PatientPlan = {
  id: "plus",
  name: "MDScout Plus",
  description: "Unlock unlimited health tools for you and your family.",
  monthlyPrice: 6.99,
  yearlyPrice: 59.99,
  priceIds: {
    monthly: "pri_01m3fbnj7wa4p133xhcgt4wtag",
    yearly: "pri_01m3fbsj63kmgqnac3y7qrpt0p",
  },
  features: [
    "Unlimited AI Symptom Checks",
    "Unlimited Health Tracker History",
    "Family Profiles (add spouse, kids, parents)",
    "Unlimited Health Document Storage (Health Vault)",
  ],
};

export function getPatientPlanPriceId(interval: PatientBillingInterval): string {
  return interval === "monthly" ? PATIENT_PLAN.priceIds.monthly : PATIENT_PLAN.priceIds.yearly;
}