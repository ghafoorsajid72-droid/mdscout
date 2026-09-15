"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY"
];

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchName, setSearchName] = useState<string>("");
  const [searchCity, setSearchCity] = useState<string>("");
  const [searchState, setSearchState] = useState<string>("");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 24;

  const [nearMeActive, setNearMeActive] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  const [viewHospital, setViewHospital] = useState<any>(null);
  const [viewHospitalGroup, setViewHospitalGroup] = useState<any[] | null>(null);

  function groupHospitals(list: any[]) {
    const groups = new Map<string, any[]>();
    for (const h of list) {
      const key = `${h.name}|${h.city}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(h);
    }
    return Array.from(groups.values()).map((records) => ({
      ...records[0],
      npiCount: records.length,
      allRecords: records,
    }));
  }

  function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 3958.8;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function handleNearMeClick() {
    if (nearMeActive) {
      setNearMeActive(false);
      setUserLocation(null);
      setLocationError("");
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Location is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setNearMeActive(true);
        setLocationLoading(false);
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Please enable it in your browser settings.");
        } else {
          setLocationError("Could not get your location. Please try again.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function fetchHospitals() {
    setLoading(true);

    if (nearMeActive && userLocation) {
      let nearQuery = supabase
        .from("hospitals")
        .select("id, npi_number, name, city, state, phone, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .neq("latitude", 0);

      if (searchName) {
        nearQuery = nearQuery.ilike("name", `%${searchName}%`);
      }
      if (searchState) {
        nearQuery = nearQuery.ilike("state", `%${searchState}%`);
      }

      nearQuery = nearQuery.limit(2000);

      const { data, error } = await nearQuery;
      if (!error && data) {
        const withDistance = data
          .map((h) => ({
            ...h,
            distanceMiles: getDistanceMiles(
              userLocation.lat,
              userLocation.lng,
              h.latitude,
              h.longitude
            ),
          }))
          .sort((a, b) => a.distanceMiles - b.distanceMiles);

          const grouped = groupHospitals(withDistance);
          grouped.sort((a, b) => a.distanceMiles - b.distanceMiles);
  
          const from = (currentPage - 1) * itemsPerPage;
          const to = from + itemsPerPage;
          setHospitals(grouped.slice(from, to));
          setTotalCount(grouped.length);
      }
      setLoading(false);
      return;
    }

    let query = supabase.from("hospitals").select("id, npi_number, name, city, state, phone, latitude, longitude");

    if (searchName) {
      query = query.ilike("name", `%${searchName}%`);
    }
    if (searchCity) {
      query = query.ilike("city", `%${searchCity}%`);
    }
    if (searchState) {
      query = query.ilike("state", `%${searchState}%`);
    }

    query = query.limit(3000);

    const { data, error } = await query;
    if (!error && data) {
      const grouped = groupHospitals(data);

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage;
      setHospitals(grouped.slice(from, to));
      setTotalCount(grouped.length);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHospitals();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchName, searchCity, searchState, currentPage, nearMeActive, userLocation]);

  useEffect(() => {
    if (searchCity.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      let cityQuery = supabase
        .from("hospitals")
        .select("city")
        .ilike("city", `${searchCity}%`)
        .not("city", "is", null)
        .limit(50);

      if (searchState) {
        cityQuery = cityQuery.eq("state", searchState);
      }

      const { data, error } = await cityQuery;
      if (!error && data) {
        const uniqueCities = Array.from(new Set(data.map((row) => row.city))).slice(0, 8);
        setCitySuggestions(uniqueCities);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchCity, searchState]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchCity, searchState]);

  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
    const section = document.getElementById("hospitals-section");
    if (section) {
      const yOffset = -90;
      const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              🛡️
            </div>
            <span className="text-xl font-extrabold text-blue-900 tracking-tight">
              MDScout<span className="text-blue-600">.io</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Find Doctors</Link>
            <Link href="/hospitals" className="text-blue-600 font-semibold">Hospitals</Link>
            <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50/60 to-transparent border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3.5 py-1 rounded-full mb-4">
            🏥 Nationwide Hospital Directory
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Find Hospitals <span className="text-blue-600">Near You</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500 max-w-xl">
            Search verified hospitals and medical centers across all 50 states.
          </p>

          <div className="mt-6 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row gap-2 max-w-3xl">
            <input
              type="text"
              placeholder="Hospital Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="flex-1 px-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-700 placeholder:font-medium outline-none rounded-xl bg-slate-50 sm:bg-white border sm:border-none border-slate-200"
            />
            <div className="relative w-full sm:w-44">
              <input
                type="text"
                placeholder="City"
                value={searchCity}
                onChange={(e) => {
                  setSearchCity(e.target.value);
                  setShowCitySuggestions(true);
                }}
                onFocus={() => setShowCitySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 250)}
                className="w-full px-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-700 placeholder:font-medium outline-none rounded-xl bg-slate-50 sm:bg-white border sm:border-none border-slate-200 sm:border-l sm:border-slate-200"
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto">
                  {citySuggestions.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setSearchCity(city);
                        setShowCitySuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      📍 {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select
              value={searchState}
              onChange={(e) => setSearchState(e.target.value)}
              className="w-full sm:w-40 px-4 py-2 text-xs sm:text-sm text-slate-900 outline-none rounded-xl bg-slate-50 sm:bg-white border sm:border-none border-slate-200 sm:border-l sm:border-slate-200"
            >
              <option value="">All States</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <button
              onClick={handleNearMeClick}
              disabled={locationLoading}
              className={`font-bold px-6 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-1.5 ${
                nearMeActive
                  ? "bg-blue-700 hover:bg-blue-800 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              📍 {locationLoading ? "Locating..." : nearMeActive ? "Near Me ✓" : "Near Me"}
            </button>
          </div>
          <div className="mt-2 h-4">
            {locationError && (
              <p className="text-xs text-red-600 font-medium">{locationError}</p>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-10" id="hospitals-section">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-medium">
            Loading Hospitals...
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hospital Directory ({totalCount.toLocaleString()} Found)
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Page {currentPage} of {totalPages || 1}
              </span>
            </div>

            {hospitals.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {hospitals.map((hosp) => (
                    <div
                      key={hosp.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition"
                    >
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center flex-shrink-0">
                            🏥
                          </div>
                          <div>
                            <h3
                              onClick={() => setViewHospital(hosp)}
                              className="font-bold text-slate-900 text-sm hover:text-blue-600 transition cursor-pointer leading-tight"
                            >
                              {hosp.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                              ✓ NPI Verified
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1.5">
                          <p className="flex items-center gap-2">
                            <span>📍</span> {hosp.city && hosp.state ? `${hosp.city}, ${hosp.state}` : hosp.address || "N/A"}
                          </p>
                          {hosp.phone && (
                            <p className="flex items-center gap-2 font-medium text-slate-800">
                              <span>📞</span> {hosp.phone}
                            </p>
                          )}
                          {hosp.npiCount > 1 ? (
                            <button
                              onClick={() => setViewHospitalGroup(hosp.allRecords)}
                              className="flex items-center gap-1.5 font-semibold text-[11px] text-blue-600 hover:underline cursor-pointer"
                            >
                              📋 {hosp.npiCount} NPI locations →
                            </button>
                          ) : (
                            hosp.npi_number && (
                              <p className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                                NPI: {hosp.npi_number}
                              </p>
                            )
                          )}
                          {nearMeActive && typeof hosp.distanceMiles === "number" && (
                            <p className="flex items-center gap-2 font-semibold text-emerald-600">
                              <span>📍</span> {hosp.distanceMiles.toFixed(1)} miles away
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => setViewHospital(hosp)}
                          className="flex-1 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                        >
                          View Details
                        </button>
                        {hosp.latitude && hosp.latitude !== 0 && (
                         <a
                          
                          href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer text-center"
                        >
                          🧭 Directions
                        </a>
                      )}
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => changePage(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 border rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition shadow-sm"
                    >
                      ← Previous
                    </button>

                    {getPageNumbers().map((p, idx) =>
                      p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => changePage(p as number)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                            currentPage === p
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => changePage(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2 border rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition shadow-sm"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                No hospitals found matching your search criteria.
              </div>
            )}
          </div>
        )}
      </main>
      {viewHospitalGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border max-h-[80vh] flex flex-col">
            <button
              onClick={() => setViewHospitalGroup(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {viewHospitalGroup[0]?.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {viewHospitalGroup.length} NPI-registered locations/providers
            </p>

            <div className="overflow-y-auto space-y-2 flex-1">
              {viewHospitalGroup.map((record: any) => (
                <div
                  key={record.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                >
                  <p className="font-semibold text-slate-800">
                    {record.city}, {record.state}
                  </p>
                  {record.phone && (
                    <p className="text-slate-600 mt-1">📞 {record.phone}</p>
                  )}
                  <p className="font-mono text-slate-400 mt-1">NPI: {record.npi_number}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewHospital && (

        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border">
            <button
              onClick={() => setViewHospital(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 font-black text-xl rounded-full flex items-center justify-center mx-auto mb-3">
                🏥
              </div>
              <h3 className="text-xl font-bold text-slate-900">{viewHospital.name}</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                ✓ NPI Verified
              </span>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200 text-slate-700">
              <p className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Address:</span>
                <span className="font-medium text-slate-900 text-right">{viewHospital.address || "N/A"}</span>
              </p>
              <p className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Location:</span>
                <span className="font-medium text-slate-900">{viewHospital.city && viewHospital.state ? `${viewHospital.city}, ${viewHospital.state}` : "N/A"}</span>
              </p>
              <p className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Phone:</span>
                <span className="font-medium text-slate-900">{viewHospital.phone || "N/A"}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-slate-500">NPI Number:</span>
                <span className="font-mono text-slate-900">{viewHospital.npi_number || "N/A"}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}