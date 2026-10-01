import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 relative">
      <Link
        href="/"
        className="absolute top-6 right-4 w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition border border-slate-200"
        title="Close"
      >
        ✕
      </Link>

      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last Updated: October 2, 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-slate-600 leading-relaxed">
            Welcome to MDScout ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit getmdscout.com or use our healthcare provider directory, symptom checker, health tracker, and Health Vault services (collectively, the "Services").
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <p className="text-slate-600 leading-relaxed mb-2">
            We collect the following categories of information:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li><strong>Account Information:</strong> name, email address, and account credentials</li>
            <li><strong>Payment Information:</strong> processed securely by our payment provider, Paddle.com. We do not store your full card details on our servers</li>
            <li><strong>Health-Related Information You Choose to Provide:</strong> symptoms entered into our Symptom Checker, health metrics logged in Health Tracker (such as blood pressure readings), and documents or family member profiles you add to Health Vault</li>
            <li><strong>Usage Data:</strong> search queries, pages visited, and features used</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies (see Section 4)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
          <p className="text-slate-600 leading-relaxed mb-2">
            We use the collected information to:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Provide, maintain, and improve the Services</li>
            <li>Process subscription payments and send related notifications</li>
            <li>Store and display the health information you choose to save (e.g., in Health Tracker or Health Vault), accessible only to you</li>
            <li>Respond to support requests sent to support@getmdscout.com</li>
            <li>Monitor and analyze usage trends to improve the Services</li>
            <li>Detect, prevent, and address technical issues or fraudulent activity</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-2">
            We do not use your symptom-checker inputs or health records to train AI models, and we do not sell this information to third parties.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Cookies &amp; Tracking Technologies</h2>
          <p className="text-slate-600 leading-relaxed mb-2">
            We use cookies and similar tracking technologies to operate and improve the Services, including:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li><strong>Google Analytics</strong> — to understand aggregate website traffic and usage patterns</li>
            <li><strong>Bing Webmaster Tools</strong> — to understand how our site appears in search results</li>
            <li><strong>Essential cookies</strong> — required for login sessions and basic site functionality</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-2">
            These tools may collect your IP address and browsing behavior in anonymized or aggregated form. You can disable cookies through your browser settings, though some features of the Services may not function properly as a result.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. How We Share Your Information</h2>
          <p className="text-slate-600 leading-relaxed mb-2">
            We do not sell your personal information. We share information only with trusted service providers who help us operate the Services, including:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li><strong>Supabase</strong> — our database and authentication provider, which stores your account and health data securely</li>
            <li><strong>Paddle</strong> — our payment processor, which handles billing and subscription transactions</li>
            <li><strong>Google Analytics / Microsoft Bing</strong> — for aggregated website analytics</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-2">
            We may also disclose information if required by law, to protect our legal rights, or to protect the safety of our users.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Data Security</h2>
          <p className="text-slate-600 leading-relaxed">
            We implement industry-standard administrative, physical, and technical safeguards designed to protect your information, including encrypted data storage, access controls, and secure (HTTPS) connections. Health documents uploaded to Health Vault are stored in a private storage bucket accessible only to your authenticated account. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Health Information &amp; HIPAA Notice</h2>
          <p className="text-slate-600 leading-relaxed">
            MDScout is a consumer health information and organizational tool. We are <strong>not a covered entity or business associate</strong> under the Health Insurance Portability and Accountability Act (HIPAA), as MDScout does not provide medical treatment, diagnosis, insurance, or billing services on behalf of healthcare providers. Information you enter into the Symptom Checker, Health Tracker, or Health Vault is stored securely for your personal reference only and is not shared with any healthcare provider, insurer, or employer unless you choose to export and share it yourself. Our Symptom Checker does not provide a medical diagnosis and is not a substitute for professional medical advice — always consult a licensed physician for medical concerns.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Data Retention</h2>
          <p className="text-slate-600 leading-relaxed">
            We retain your account and health information for as long as your account remains active, or as needed to provide the Services. If you delete your account, your personal data and health records are permanently deleted from our active systems within 30 days, except where retention is required for legal, billing, or fraud-prevention purposes.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">9. Your Privacy Rights</h2>
          <p className="text-slate-600 leading-relaxed mb-2">
            Depending on your state of residence (including rights available to California residents under the CCPA/CPRA), you may have the right to:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of the sale or sharing of personal information (note: we do not sell your data)</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-2">
            To exercise any of these rights, email us at <a href="mailto:support@getmdscout.com" className="font-medium text-blue-600 hover:underline">support@getmdscout.com</a>. You can also delete most of your own data directly from your account settings and the Health Vault page at any time.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">10. Children's Privacy</h2>
          <p className="text-slate-600 leading-relaxed">
            The Services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us at support@getmdscout.com and we will delete it.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">11. International Users</h2>
          <p className="text-slate-600 leading-relaxed">
            MDScout is intended for use by individuals located in the United States seeking US-based healthcare providers. Our servers and infrastructure providers (Supabase, Vercel) may process data in the United States or other countries. By using the Services, you consent to this transfer and processing of information.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">12. Changes to This Policy</h2>
          <p className="text-slate-600 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Last Updated" date at the top of this page. We encourage you to review this policy periodically.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">13. Contact Us</h2>
          <p className="text-slate-600 leading-relaxed">
            If you have questions or comments about this policy, or wish to exercise your privacy rights, you may email us at <a href="mailto:support@getmdscout.com" className="font-medium text-blue-600 hover:underline">support@getmdscout.com</a>.
          </p>
        </div>
      </section>
    </div>
  );
}