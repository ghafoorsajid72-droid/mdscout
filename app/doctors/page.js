'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PAGE_SIZE = 12;
const DEFAULT_TOTAL = 2259000;

export default function DoctorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(DEFAULT_TOTAL);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchError, setSearchError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const fetchDoctors = async (page = 1) => {
    setLoading(true);
    setSearchError('');

    let cleanedTerm = searchTerm
      .trim()
      .replace(/^dr\.?\s+/i, '')
      .replace(/^doctor\s+/i, '')
      .replace(/,/g, '');

    if (cleanedTerm.length > 0 && cleanedTerm.length < 2 && !/^\d+$/.test(cleanedTerm)) {
      setSearchError('Please enter at least 2 characters to search by name.');
      setLoading(false);
      return;
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('doctors')
      .select('npi_number, first_name, last_name, city, state, address, phone');

    if (cleanedTerm) {
      const isNum = /^\d+$/.test(cleanedTerm);
      if (isNum) {
        query = query.eq('npi_number', cleanedTerm);
      } else {
        const terms = cleanedTerm.split(/\s+/).filter(Boolean);
        if (terms.length === 1) {
          query = query.or(`last_name.ilike.${terms[0]}%,first_name.ilike.${terms[0]}%`);
        } else if (terms.length >= 2) {
          query = query.ilike('first_name', `${terms[0]}%`).ilike('last_name', `${terms[1]}%`);
        }
      }
    }

    if (stateFilter) {
      query = query.eq('state', stateFilter.toUpperCase());
    }

    query = query.range(from, to);
    const { data, error } = await query;

    if (error) {
      console.error('Search error:', error.message);
      setSearchError('Query timed out. Try refining search with Last Name or NPI.');
      setDoctors([]);
    } else {
      setDoctors(data || []);
      if (cleanedTerm || stateFilter) {
        setTotalCount(data.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + data.length : page * PAGE_SIZE + 100);
      } else {
        setTotalCount(DEFAULT_TOTAL);
      }
    }
    setLoading(false);
  };
  useEffect(() => {
    setCurrentPage(1);
    fetchDoctors(1);
  }, [stateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDoctors(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchDoctors(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          MDScout Doctor Directory
        </h1>
        <p className="mt-2 text-gray-600">
          Search from over 2.1M+ active verified healthcare providers across the US
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by Last Name (e.g. Smith) or NPI Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 placeholder-gray-500 font-medium text-base"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 font-medium text-base bg-white"
            >
              <option value="">All States</option>
              <option value="CA">California (CA)</option>
              <option value="NY">New York (NY)</option>
              <option value="TX">Texas (TX)</option>
              <option value="FL">Florida (FL)</option>
              <option value="IL">Illinois (IL)</option>
              <option value="PA">Pennsylvania (PA)</option>
              <option value="OH">Ohio (OH)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {searchError && (
          <p className="text-red-600 text-sm font-semibold mt-2 px-1">{searchError}</p>
        )}
      </div>

      <div className="flex justify-between items-center mb-6 px-1">
        <span className="text-gray-700 font-semibold">
          Showing results <span className="text-gray-900 font-bold">({totalCount.toLocaleString()} available)</span>
        </span>
        <span className="text-sm text-gray-600 font-medium">Page {currentPage}</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-600 font-semibold text-lg">⚡ Fetching doctors fast...</div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-600 font-medium">
          No active doctors found matching criteria.
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
                    <h3 className="text-lg font-bold text-gray-900">Dr. {doc.first_name} {doc.last_name}</h3>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md">General Medicine</span>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">Active</span>
                </div>

                <div className="space-y-2 text-sm text-gray-700 font-medium mt-4">
                  <div className="flex items-center gap-2">
                    <span>📍</span><span>{doc.city ? `${doc.city}, ` : ''}{doc.state}</span>
                  </div>
                  {doc.phone && (
                    <div className="flex items-center gap-2">
                      <span>📞</span><span>{doc.phone}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 font-mono mt-2">NPI: {doc.npi_number}</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setSelectedDoctor(doc)}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Send Inquiry / Contact →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-700 font-semibold">Page {currentPage}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={doctors.length < PAGE_SIZE}
            className="px-5 py-2.5 bg-blue-600 border border-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm"
          >
            Next →
          </button>
        </div>
      )}

      {selectedDoctor && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="bg-blue-50 px-6 py-4 flex justify-between items-start border-b border-blue-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</h2>
                <p className="text-sm text-blue-700 font-semibold mt-1">NPI: {selectedDoctor.npi_number}</p>
              </div>
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="text-gray-500 hover:text-gray-900 font-bold transition-colors bg-white rounded-full p-1 w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-800 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="font-bold text-gray-900">Practice Location</p>
                    <p className="text-gray-700 font-medium">{selectedDoctor.address || 'Address not listed'}</p>
                    <p className="text-gray-700 font-medium">{selectedDoctor.city ? `${selectedDoctor.city}, ` : ''}{selectedDoctor.state}</p>
                  </div>
                </div>
                {selectedDoctor.phone && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg">📞</span>
                    <div>
                      <p className="font-bold text-gray-900">Phone Number</p>
                      <p className="text-gray-700 font-medium">{selectedDoctor.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); alert('Inquiry Sent Successfully!'); setSelectedDoctor(null); }} className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2 text-base">Send Direct Inquiry</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    required 
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none w-full text-gray-900 placeholder-gray-500 font-medium text-sm" 
                  />
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    required 
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none w-full text-gray-900 placeholder-gray-500 font-medium text-sm" 
                  />
                </div>
                <textarea 
                  placeholder="Write your message or inquiry details here..." 
                  required 
                  rows="3" 
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none w-full resize-none text-gray-900 placeholder-gray-500 font-medium text-sm"
                ></textarea>
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-all duration-200 text-base">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}