import React from 'react';
import Link from 'next/link';

export default function Pricing() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-slate-800 relative">
      <Link
        href="/"
        className="absolute top-6 right-4 w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition border border-slate-200"
        title="Close"
      >
        ✕
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3">Simple, Transparent Pricing</h1>
        <p className="text-slate-600">Choose the plan that fits your healthcare data needs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Basic Access</h3>
            <p className="text-sm text-slate-500 mb-4">For individuals searching for healthcare providers.</p>
            <div className="text-3xl font-extrabold mb-6">$0 <span className="text-sm font-normal text-slate-500">/ forever</span></div>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li>✓ Basic Provider Searches</li>
              <li>✓ Doctor & Hospital Directories</li>
              <li>✓ Public Specialty Filters</li>
            </ul>
          </div>
          <button className="w-full py-2 px-4 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 text-sm">
            Get Started
          </button>
        </div>

        {/* Pro Plan */}
        <div className="border-2 border-blue-600 rounded-xl p-6 bg-white shadow-md flex flex-col justify-between relative">
          <span className="absolute -top-3 right-4 bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">Popular</span>
          <div>
            <h3 className="text-xl font-bold mb-2">Pro Scout</h3>
            <p className="text-sm text-slate-500 mb-4">For power users and clinical researchers.</p>
            <div className="text-3xl font-extrabold mb-6">$29 <span className="text-sm font-normal text-slate-500">/ month</span></div>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li>✓ Advanced Search Filters</li>
              <li>✓ Detailed NPI & License Data</li>
              <li>✓ Saved Search Lists</li>
              <li>✓ Export Search Results (CSV)</li>
            </ul>
          </div>
          <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm">
            Subscribe Pro
          </button>
        </div>

        {/* API Plan */}
        <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Developer API</h3>
            <p className="text-sm text-slate-500 mb-4">For tech teams building healthcare apps.</p>
            <div className="text-3xl font-extrabold mb-6">$99 <span className="text-sm font-normal text-slate-500">/ month</span></div>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li>✓ Full REST API Access</li>
              <li>✓ 50,000 API Requests/mo</li>
              <li>✓ Real-time NPI Data Sync</li>
              <li>✓ Priority Developer Support</li>
            </ul>
          </div>
          <button className="w-full py-2 px-4 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 text-sm">
            Get API Key
          </button>
        </div>
      </div>
    </div>
  );
}