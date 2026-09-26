"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getPaddle } from "@/lib/paddle";
import {
  PATIENT_PLAN,
  getPatientPlanPriceId,
  type PatientBillingInterval,
} from "@/lib/patient-plan";

export default function PlusPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<PatientBillingInterval>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!user.email) {
      alert("Your account is missing an email address. Please update your profile before subscribing.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const paddle = await getPaddle();
      if (!paddle) {
        alert("Payment system is unavailable. Please try again later.");
        return;
      }

      const priceId = getPatientPlanPriceId(billingInterval);

      paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "light",
          allowLogout: false,
        },
        items: [{ priceId, quantity: 1 }],
        customer: {
          email: user.email,
        },
        customData: {
          supabase_user_id: user.id,
          plan_type: "patient",
        },
      });
    } catch (error) {
      console.error("Failed to open Paddle checkout:", error);
      alert("Could not open checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const price = billingInterval === "monthly" ? PATIENT_PLAN.monthlyPrice : PATIENT_PLAN.yearlyPrice;
  const period = billingInterval === "monthly" ? "month" : "year";

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-slate-800 relative">
      <Link
        href="/"
        className="absolute top-6 right-4 w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition border border-slate-200"
        title="Close"
      >
        ✕
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">MDScout Plus</h1>
        <p className="text-slate-600">Unlock unlimited health tools for you and your family.</p>
      </div>

      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              billingInterval === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
              billingInterval === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Yearly
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
              Save ~29%
            </span>
          </button>
        </div>
      </div>

      <div className="rounded-xl p-6 bg-white flex flex-col justify-between relative border-2 border-blue-600 shadow-md">
        <div>
          <h3 className="text-xl font-bold mb-2">{PATIENT_PLAN.name}</h3>
          <p className="text-sm text-slate-500 mb-4">{PATIENT_PLAN.description}</p>
          <div className="text-3xl font-extrabold mb-6">
            ${price} <span className="text-sm font-normal text-slate-500">/ {period}</span>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 mb-6">
            {PATIENT_PLAN.features.map((feature) => (
              <li key={feature}>
                ✓{" "}
                {feature.includes("Health Vault") ? (
                  <Link href="/health-vault" className="hover:underline">{feature}</Link>
                ) : (
                  feature
                )}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={handleSubscribe}
          disabled={authLoading || checkoutLoading}
          className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-150 disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
        >
          {checkoutLoading
            ? "Opening checkout..."
            : authLoading
              ? "Loading..."
              : user
                ? "Subscribe"
                : "Sign in to Subscribe"}
        </button>
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