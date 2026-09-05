"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getPaddle } from "@/lib/paddle";
import {
  PRICING_PLANS,
  getPlanPriceId,
  type BillingInterval,
  type PlanId,
  type PricingPlan,
} from "@/lib/pricing-plans";

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      setAuthLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    getPaddle();
  }, []);

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setCheckoutLoading(plan.id);

    try {
      const paddle = await getPaddle();
      if (!paddle) {
        alert("Payment system is unavailable. Please try again later.");
        return;
      }

      const priceId = getPlanPriceId(plan, billingInterval);

      paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "light",
          allowLogout: false,
        },
        items: [{ priceId, quantity: 1 }],
        customer: {
          email: user.email ?? undefined,
        },
        customData: {
          supabase_user_id: user.id,
        },
      });
    } catch (error) {
      console.error("Failed to open Paddle checkout:", error);
      alert("Could not open checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-slate-800 relative">
      <Link
        href="/"
        className="absolute top-6 right-4 w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition border border-slate-200"
        title="Close"
      >
        ✕
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Simple, Transparent Pricing</h1>
        <p className="text-slate-600">
          Choose the plan that fits your healthcare data needs.
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              billingInterval === "monthly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
              billingInterval === "yearly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Yearly
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
              Save ~17%
            </span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((plan) => {
          const price =
            billingInterval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
          const period = billingInterval === "monthly" ? "month" : "year";
          const isLoading = checkoutLoading === plan.id;

          return (
            <div
              key={plan.id}
              className={`rounded-xl p-6 bg-white flex flex-col justify-between relative ${
                plan.popular
                  ? "border-2 border-blue-600 shadow-md"
                  : "border border-slate-200 shadow-sm"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-4 bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Popular
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                <div className="text-3xl font-extrabold mb-6">
                  ${price}{" "}
                  <span className="text-sm font-normal text-slate-500">/ {period}</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSubscribe(plan)}
                disabled={authLoading || isLoading}
                className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-150 disabled:opacity-50 ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isLoading
                  ? "Opening checkout..."
                  : authLoading
                    ? "Loading..."
                    : user
                      ? "Subscribe"
                      : "Sign in to Subscribe"}
              </button>
            </div>
          );
        })}
      </div>

      {!authLoading && !user && (
        <p className="text-center text-xs text-slate-500 mt-8">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>{" "}
          before subscribing so we can link your plan to your profile.
        </p>
      )}
    </div>
  );
}
