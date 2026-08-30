'use client';

import { useState, useEffect } from 'react';
import { 
  Search, MapPin, Building2, ChevronRight, Star, 
  ShieldCheck, Heart, Stethoscope, Baby, Brain, 
  Activity, User, CheckCircle2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DoctorSearchResults() {
  const [doctors, setDoctors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [stateInput, setStateInput] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Specialty mapping
  const specialties = [
    { name: 'All', label: 'All Specialties', icon: Stethoscope, term: '' },
    { name: 'Primary Care', label: 'Primary Care', icon: User, term: 'Internal Medicine' },
    { name: 'Cardiology', label: 'Cardiology', icon: Heart, term: 'Cardi' },
    { name: 'Dermatology', label: 'Dermatology', icon: Activity, term: 'Dermat' },
    { name: 'Pediatrics', label: 'Pediatrics', icon: Baby, term: 'Pediatr' },
    { name: 'Neurology', label: 'Neurology', icon: Brain, term: 'Neuro' },
  ];

  // Fetch Doctors from Supabase
  const fetchDoctors = async (overrideCategory) => {
    setLoading(true);
    try {
      let query = supabase
        .from('doctors')
        .select('*', { count: 'exact' });

      // Search Query (Name / NPI)
      if (searchQuery.trim()) {
        query = query.or(`first_name.ilike.%${searchQuery.trim()}%,last_name.ilike.%${searchQuery.trim()}%,npi_number.ilike.%${searchQuery.trim()}%`);
      }

      // City filter
      if (cityInput.trim()) {
        query = query.ilike('city', `%${cityInput.trim()}%`);
      }

      // State filter
      if (stateInput.trim()) {
        query = query.ilike('state', `%${stateInput.trim()}%`);
      }

      // Specialty Filter logic (Broad text matching)
      const activeCatName = overrideCategory !== undefined ? overrideCategory : selectedSpecialty;
      const targetObj = specialties.find(s => s.name === activeCatName);

      if (targetObj && targetObj.term) {
        // Multi-column wildcard search across name or text columns fallback
        query = query.or(`first_name.ilike.%${targetObj.term}%,last_name.ilike.%${targetObj.term}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;

      setDoctors(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [page]);

  const handleCategoryClick = (categoryName) => {
    setSelectedSpecialty(categoryName);
    setPage(1);
    fetchDoctors(categoryName);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
      
      {/* HERO SEARCH BAR */}
      <form onSubmit={handleSearch} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Find Top Doctors & Clinics Near You in <span className="text-blue-500">Seconds</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Doctor Name or NPI" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="City (e.g., Brooklyn)" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
              placeholder="State (e.g., NY)" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl py-2.5 px-6 transition duration-200 flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            Find Doctors
          </button>
        </div>
      </form>

      {/* SPECIALTY TABS */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Browse by Specialty</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {specialties.map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = selectedSpecialty === item.name;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCategoryClick(item.name)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 gap-2 cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10 scale-[1.02]' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <IconComponent className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DIRECTORY LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-400 font-medium animate-pulse">
            Loading doctors for {selectedSpecialty}...
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            No doctors found matching "{selectedSpecialty}". Click "All Specialties" to view all records.
          </div>
        ) : (
          doctors.map((doc, idx) => (
            <div key={doc.npi_number || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-blue-400 shrink-0">
                    {doc.first_name?.[0] || 'D'}{doc.last_name?.[0] || 'R'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base md:text-lg">
                        Dr. {doc.first_name} {doc.last_name}
                      </h3>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> NPI Verified
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{doc.city}, {doc.state} • NPI: {doc.npi_number}</p>
                  </div>
                </div>
                <button className="bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white font-medium text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5">
                  View Profile <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-1.5 text-xs bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-40"
          >
            ← Previous
          </button>
          <div className="text-xs text-slate-400">
            Page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span>
          </div>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

    </div>
  );
}