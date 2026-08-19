import React from 'react';

export default function ContactUs() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold mb-3">Contact Us</h1>
      <p className="text-slate-600 mb-8">
        Have questions about MDScout, our provider data, or API access? Reach out to us below.
      </p>

      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input 
            type="text" 
            placeholder="John Doe" 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input 
            type="email" 
            placeholder="you@example.com" 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
          <textarea 
            rows={4} 
            placeholder="How can we help you?" 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
          Send Message
        </button>
      </div>

      <div className="mt-8 text-center text-sm text-slate-500">
        Direct Email: <span className="font-medium text-slate-700">support@mdscout.io</span>
      </div>
    </div>
  );
}