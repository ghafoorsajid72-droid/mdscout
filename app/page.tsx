'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Doctor {
  number: string;
  enumeration_type?: string;
  basic?: {
    first_name?: string;
    last_name?: string;
    credential?: string;
    organization_name?: string;
    name?: string;
  };
  taxonomies?: Array<{
    desc?: string;
    primary?: boolean;
  }>;
  addresses?: Array<{
    city?: string;
    state?: string;
    telephone_number?: string;
    address_1?: string;
  }>;
}

const CATEGORIES = [
  { id: 'pediatrics', label: 'Child Care (Pediatrics)', taxonomy: 'Pediatrics', icon: '👶', desc: 'For babies, kids & teens' },
  { id: 'obgyn', label: "Women's & Pregnancy", taxonomy: 'Obstetrics & Gynecology', icon: '🤰', desc: 'OB-GYN & Maternity care' },
  { id: 'family', label: 'Primary & Family Care', taxonomy: 'Family Medicine', icon: '🩺', desc: 'Everyday adult health' },
  { id: 'dentist', label: 'Dental Care', taxonomy: 'Dentist', icon: '🦷', desc: 'Dentists & Orthodontists' },
  { id: 'cardiology', label: 'Heart & Vascular', taxonomy: 'Cardiology', icon: '❤️', desc: 'Cardiologists & Specialists' },
  { id: 'geriatrics', label: 'Senior Care (Elderly)', taxonomy: 'Geriatric Medicine', icon: '👵', desc: 'Senior & Geriatric Care' },
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [city, setCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Doctor[]>([]);
  const [searched, setSearched] = useState(false);

  const fetchDoctors = async (queryTerm = searchTerm, categoryTaxonomy = selectedCategory) => {
    setLoading(true);
    setSearched(true);
    try {
      const queryParams = new URLSearchParams();

      if (categoryTaxonomy) {
        queryParams.set('taxonomy_code', categoryTaxonomy);
      } else if (queryTerm) {
        queryParams.set('term', queryTerm);
      }

      if (city) queryParams.set('city', city);
      if (stateCode) queryParams.set('state', stateCode);

      const res = await fetch(`/api/npi?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const doctorsList = Array.isArray(data) ? data : (data.results || []);
        setResults(doctorsList);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedCategory('');
    fetchDoctors(searchTerm, '');
  };

  const handleCategoryClick = (taxonomy: string) => {
    const newTaxonomy = selectedCategory === taxonomy ? '' : taxonomy;
    setSelectedCategory(newTaxonomy);
    setSearchTerm('');
    fetchDoctors('', newTaxonomy);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Header Logo with Medical Shield Icon */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              MDScout<span className="text-blue-600">.io</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Official US NPI Registry
            </span>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50/80 to-slate-50 py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-4">
            🛡️ Trusted Nationwide Healthcare Finder
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Find Top Doctors & Clinics Near You in Seconds
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Search licensed physicians, pediatricians, dentists, and specialists across all US states with verified credentials.
          </p>

          <form onSubmit={handleSearch} className="mt-8 bg-white p-3 sm:p-4 rounded-2xl shadow-lg border border-slate-200 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Doctor Name, Specialty, or NPI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="text"
              placeholder="City (e.g., Brooklyn)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full sm:w-40 px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="text"
              placeholder="State (e.g. NY)"
              maxLength={2}
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="w-full sm:w-28 px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm uppercase"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:bg-blue-400 text-sm"
            >
              {loading ? 'Searching...' : 'Find Doctor'}
            </button>
          </form>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Browse Healthcare by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.taxonomy)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedCategory === cat.taxonomy
                  ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{cat.label}</h3>
                <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Fetching verified medical providers...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-8">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-bold text-slate-900">No Doctors Found</h3>
            <p className="text-sm text-slate-500 mt-1">Try searching without city/state filter to get broader results.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Search Results ({results.length})</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((doc) => {
                const isIndividual = doc.enumeration_type === 'NPI-1' || doc.basic?.first_name || doc.basic?.last_name;
                
                let displayName = 'Healthcare Provider';
                if (isIndividual) {
                  const firstName = doc.basic?.first_name || '';
                  const lastName = doc.basic?.last_name || '';
                  displayName = `Dr. ${firstName} ${lastName}`.trim();
                } else {
                  displayName = doc.basic?.organization_name || doc.basic?.name || 'Medical Facility';
                }

                const addr = doc.addresses?.[0];
                const taxonomy = doc.taxonomies?.[0];

                return (
                  <div key={doc.number} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md mb-2">
                            Verified Provider
                          </span>
                          <Link href={`/doctor/${doc.number}`} className="block group">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                              {displayName}{' '}
                              {doc.basic?.credential && <span className="text-slate-400 font-normal text-sm">({doc.basic.credential})</span>}
                            </h3>
                          </Link>
                          <p className="text-sm text-blue-600 font-semibold mt-0.5">
                            {taxonomy?.desc || 'General Practice'}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded-lg border border-slate-200">
                          NPI: {doc.number}
                        </span>
                      </div>

                      {addr && (
                        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                          <p>📍 Location: {addr.city ? `${addr.city}, ` : ''}{addr.state || ''}</p>
                          {addr.telephone_number && <p className="font-medium text-slate-800">📞 Phone: {addr.telephone_number}</p>}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                      <Link href={`/doctor/${doc.number}`} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                        View Full Profile →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}