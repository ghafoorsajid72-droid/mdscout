"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);

      let dbQuery = supabase.from("doctors").select("*");

      if (selectedSpecialty) {
        dbQuery = dbQuery.eq("specialty", selectedSpecialty);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error("Supabase Error:", error.message);
      } else {
        setDoctors(data || []);
      }
      setLoading(false);
    }

    fetchDoctors();
  }, [selectedSpecialty]);

  // Front-end Search Filtering
  const filteredDoctors = doctors.filter((doc) => {
    const searchLower = query.toLowerCase();
    const fullName = `${doc.first_name || ""} ${doc.last_name || ""}`.toLowerCase();
    const city = (doc.city || "").toLowerCase();
    const npi = doc.npi_number || doc.npi || "";

    return (
      fullName.includes(searchLower) ||
      city.includes(searchLower) ||
      npi.includes(query)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
          Find Healthcare Providers & NPI Data
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Search over millions of doctors, specialists, and medical facilities with real-time NPI lookup.
        </p>
      </div>

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

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">
          Loading doctors from database...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc) => (
              <div
                key={doc.id || doc.npi_number}
                className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    Dr. {doc.first_name} {doc.last_name}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium">{doc.specialty || "General Practice"}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    📍 {doc.city || "N/A"}, {doc.state || "N/A"} | NPI:{" "}
                    <span className="font-mono">{doc.npi_number || doc.npi}</span>
                  </p>
                </div>

                <Link
                  href={`/doctor/${doc.id || doc.npi_number}`}
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
      )}
    </div>
  );
}