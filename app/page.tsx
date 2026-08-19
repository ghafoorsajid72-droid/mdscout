"use client";

import { useState } from "react";
import Link from "next/link";

// Temporary Mock Data (Jab tak Supabase live data connect nahi karte)
const MOCK_DOCTORS = [
  {
    id: "1012345678",
    name: "Dr. Sarah Ahmed",
    specialty: "Cardiology",
    city: "Chicago",
    state: "IL",
    npi: "1012345678",
  },
  {
    id: "1023456789",
    name: "Dr. Michael Chen",
    specialty: "Pediatrics",
    city: "Houston",
    state: "TX",
    npi: "1023456789",
  },
  {
    id: "1034567890",
    name: "Dr. Fatima Ali",
    specialty: "Dermatology",
    city: "New York",
    state: "NY",
    npi: "1034567890",
  },
  {
    id: "1045678901",
    name: "Dr. James Wilson",
    specialty: "Cardiology",
    city: "Dallas",
    state: "TX",
    npi: "1045678901",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  // Filtering Logic
  const filteredDoctors = MOCK_DOCTORS.filter((doc) => {
    const matchesQuery =
      doc.name.toLowerCase().includes(query.toLowerCase()) ||
      doc.city.toLowerCase().includes(query.toLowerCase()) ||
      doc.npi.includes(query);
    const matchesSpecialty = selectedSpecialty
      ? doc.specialty === selectedSpecialty
      : true;

    return matchesQuery && matchesSpecialty;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
          Find Healthcare Providers & NPI Data
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Search over millions of doctors, specialists, and medical facilities with real-time NPI lookup.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search by doctor name, city, or NPI number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Specialties</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="Dermatology">Dermatology</option>
        </select>
      </div>

      {/* Search Results Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-lg text-slate-900">{doc.name}</h3>
                <p className="text-sm text-blue-600 font-medium">{doc.specialty}</p>
                <p className="text-xs text-slate-500 mt-1">
                  📍 {doc.city}, {doc.state} | NPI: <span className="font-mono">{doc.npi}</span>
                </p>
              </div>

              <Link
                href={`/doctor/${doc.id}`}
                className="px-3.5 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                View Profile →
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-10 text-slate-500">
            No doctors found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}