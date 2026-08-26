'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DoctorSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Initial load: Default doctors list
  const fetchDoctors = async () => {
    setLoading(true);
    let query = supabase.from('doctors').select('*', { count: 'exact' });

    if (searchTerm.trim()) {
      // Search by NPI (numeric) or Last Name / First Name
      const isNum = /^\d+$/.test(searchTerm.trim());
      if (isNum) {
        query = query.eq('npi_number', searchTerm.trim());
      } else {
        query = query.or(`last_name.ilike.${searchTerm.trim()}%,first_name.ilike.${searchTerm.trim()}%`);
      }
    }

    if (stateFilter) {
      query = query.eq('state', stateFilter.toUpperCase());
    }

    query = query.range(0, 11); // Show 12 cards per page

    const { data, count, error } = await query;

    if (error) {
      console.error('Search error:', error.message);
    } else {
      setDoctors(data || []);
      if (count !== null) setTotalCount(count);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, [stateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          MDScout Doctor Directory
        </h1>
        <p className="mt-2 text-gray-600">
          Search from over 2.1M+ active verified healthcare providers across the US
        </p>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by Name or NPI Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-800 text-base"
            />
          </div>

          {/* State Filter Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-800 text-base bg-white"
            >
              <option value="">All States</option>
              <option value="CA">California (CA)</option>
              <option value="NY">New York (NY)</option>
              <option value="TX">Texas (TX)</option>
              <option value="FL">Florida (FL)</option>
              <option value="IL">Illinois (IL)</option>
              <option value="PA">Pennsylvania (PA)</option>
              <option value="OH">Ohio (OH)</option>
              <option value="NC">North Carolina (NC)</option>
              <option value="GA">Georgia (GA)</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Results Count Bar */}
      <div className="flex justify-between items-center mb-6 px-1">
        <span className="text-gray-600 font-medium">
          Showing results {doctors.length > 0 ? `(Found ${totalCount > 0 ? totalCount.toLocaleString() : 'doctors'})` : ''}
        </span>
      </div>

      {/* Doctors Grid Cards */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 font-medium text-lg">
          🔍 Searching database...
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-500">
          No active doctors found matching your criteria. Try adjusting your search term.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.npi_number}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Dr. {doc.first_name} {doc.last_name}
                    </h3>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md">
                      General Medicine
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Active
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mt-4">
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{doc.city ? `${doc.city}, ` : ''}{doc.state}</span>
                  </div>
                  {doc.phone && (
                    <div className="flex items-center gap-2">
                      <span>📞</span>
                      <span>{doc.phone}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 font-mono mt-2">
                    NPI: {doc.npi_number}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => alert(`Contacting Dr. ${doc.first_name} ${doc.last_name}`)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Send Inquiry / Contact →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}