import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last Updated: August 19, 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-slate-600 leading-relaxed">
            Welcome to MDScout ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your data when you visit our website or use our healthcare provider directory services.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <p className="text-slate-600 leading-relaxed mb-2">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Account information (Name, Email, Organization)</li>
            <li>Search queries and saved preferences</li>
            <li>Technical data (IP address, browser type, device information)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
          <p className="text-slate-600 leading-relaxed mb-2">
            We use the collected information to:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Provide, maintain, and improve MDScout services</li>
            <li>Process transactions and send related notifications</li>
            <li>Respond to comments, questions, and customer service requests</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Data Security & HIPAA</h2>
          <p className="text-slate-600 leading-relaxed">
            MDScout adheres to industry-standard administrative, physical, and technical safeguards. Our platform is designed with privacy and security controls appropriate for managing healthcare provider information in compliance with applicable standards.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Contact Us</h2>
          <p className="text-slate-600 leading-relaxed">
            If you have questions or comments about this policy, you may email us at <span className="font-medium text-blue-600">support@mdscout.io</span>.
          </p>
        </div>
      </section>
    </div>
  );
}