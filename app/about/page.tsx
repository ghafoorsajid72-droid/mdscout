import React from 'react';

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold mb-4">About MDScout</h1>
      <p className="text-lg text-slate-600 mb-8 leading-relaxed">
        MDScout is a modern healthcare data and provider discovery platform designed to connect individuals, organizations, and developers with verified medical professional information.
      </p>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed">
            Our mission is to simplify healthcare navigation by providing transparent, accurate, and accessible provider data. Whether you are searching for specialists, healthcare institutions, or clinical data access via API, MDScout streamlines the search process.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">What We Provide</h2>
          <ul className="list-disc pl-6 text-slate-600 space-y-2">
            <li><strong>Verified Provider Directory:</strong> Access to comprehensive profiles of doctors and healthcare facilities.</li>
            <li><strong>Advanced Search & Filtering:</strong> Search by specialty, location, state, and practice details.</li>
            <li><strong>Developer API:</strong> Clean API endpoints for seamless integration into healthcare workflows.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}