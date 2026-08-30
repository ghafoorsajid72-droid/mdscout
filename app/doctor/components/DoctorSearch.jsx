'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dolmodcgwmuejkmqntit.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qiaQY5jNgecySdh8DpvCXQ_TMNam9Pa'; // Public key is fine for read-only
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SPECIALTIES = [
  'All',
  'Primary Care',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Neurology'
];

export default function DoctorSearch() {
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty, page]);

  async function fetchDoctors() {
    setLoading(true);
    let query = supabase
      .from('doctors')
      .select('*', { count: 'exact' });

    // Specialty Filter Logic
    if (selectedSpecialty && selectedSpecialty !== 'All') {
      query = query.eq('specialty', selectedSpecialty);
    }

    // Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching doctors:', error);
    } else {
      setDoctors(data || []);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Specialty Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SPECIALTIES.map((spec) => (
          <button
            key={spec}
            onClick={() => {
              setSelectedSpecialty(spec);
              setPage(1); // Filter change par Page 1 par reset karein
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedSpecialty === spec
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="text-center py-10">Doctors load ho rahe hain...</div>
      ) : (
        /* Doctor Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <div key={doc.npi_number} className="border p-4 rounded-xl shadow-sm bg-white">
              <h3 className="font-bold text-lg">{doc.first_name} {doc.last_name}</h3>
              <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded mt-1 font-semibold">
                {doc.specialty}
              </span>
              <p className="text-sm text-gray-600 mt-2">{doc.address || 'Address N/A'}</p>
              <p className="text-sm text-gray-500">{doc.city}, {doc.state}</p>
              <p className="text-xs text-gray-400 mt-1">Phone: {doc.phone || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Next/Previous Pagination Controls */}
      <div className="flex justify-between items-center mt-8">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous Page
        </button>
        <span>Page {page}</span>
        <button
          disabled={doctors.length < PAGE_SIZE}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next Page
        </button>
      </div>
    </div>
  );
}