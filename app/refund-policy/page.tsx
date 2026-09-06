
"use client";
import Link from "next/link";
export default function RefundPolicyPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-16 relative">
        <Link
  href="/"
  className="absolute top-6 right-4 w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition border border-slate-200"
  title="Close"
>
  ✕
</Link>
        <h1 className="text-3xl font-bold mb-6">Refund Policy</h1>
        <p className="text-gray-600 mb-4">Last updated: September 2026</p>
  
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-2">Free Trial</h2>
            <p>
              All MDScout subscription plans include a 7-day free trial. You will
              not be charged until the trial period ends. You may cancel anytime
              during the trial at no cost.
            </p>
          </section>
  
          <section>
            <h2 className="text-xl font-semibold mb-2">Cancellations</h2>
            <p>
              You may cancel your subscription at any time from your account
              settings. Your access will continue until the end of your current
              billing period.
            </p>
          </section>
  
          <section>
            <h2 className="text-xl font-semibold mb-2">Refunds</h2>
            <p>
              We do not provide refunds or credits for partial billing periods.
              If you believe you were charged in error, please contact our
              support team and we will review your request.
            </p>
          </section>
  
          <section>
            <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
            <p>
              For billing questions or refund requests, please reach out via our
              Contact Us page.
            </p>
          </section>
        </div>
      </div>
    );
  }