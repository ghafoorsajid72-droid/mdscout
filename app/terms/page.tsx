import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 relative">
      <Link
        href="/"
        className="absolute top-6 right-4 w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition border border-slate-200"
        title="Close"
      >
        ✕
      </Link>

      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last Updated: August 19, 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Agreement to Terms</h2>
          <p className="text-slate-600 leading-relaxed">
            By accessing or using MDScout, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not access or use our platform.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Description of Services</h2>
          <p className="text-slate-600 leading-relaxed">
            MDScout provides a database and search infrastructure for medical providers, healthcare facilities, and related clinical data.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. User Accounts</h2>
          <p className="text-slate-600 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Disclaimer</h2>
          <p className="text-slate-600 leading-relaxed">
            The data provided on MDScout is for informational purposes only and does not constitute medical, legal, or professional advice.
          </p>
        </div>
      </section>
    </div>
  );
}