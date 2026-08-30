"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Favorites State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);

  // Search Inputs
  const [searchName, setSearchName] = useState<string>("");
  const [searchCity, setSearchCity] = useState<string>("");
  const [searchState, setSearchState] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 12;

  // Separate Modal States
  const [viewDoctorProfile, setViewDoctorProfile] = useState<any>(null);
  const [selectedDoctorForInquiry, setSelectedDoctorForInquiry] = useState<any>(null);

  // Inquiry Form States
  const [inquiryType, setInquiryType] = useState<string>("General Query");
  const [message, setMessage] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("");
  const [senderEmail, setSenderEmail] = useState<string>("");
  const [submittingInquiry, setSubmittingInquiry] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<string>("");

  // Load user + favorites once on mount
  useEffect(() => {
    const savedFavs = localStorage.getItem("mdscout_favs");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {}
    }

    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setSenderEmail(user.email || "");
        setSenderName(user.user_metadata?.full_name || "");
      }
    }
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setSenderEmail(u.email || "");
        setSenderName(u.user_metadata?.full_name || "");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch doctors from Supabase - SERVER-SIDE filtering + pagination
  async function fetchDoctors() {
    setLoading(true);
    let query = supabase.from("doctors").select("*", { count: "exact" });

    if (selectedCategory !== "All") {
      query = query.ilike("specialty", `%${selectedCategory}%`);
    }
    if (searchName) {
      query = query.or(
        `first_name.ilike.%${searchName}%,last_name.ilike.%${searchName}%,npi_number.ilike.%${searchName}%`
      );
    }
    if (searchCity) {
      query = query.ilike("city", `%${searchCity}%`);
    }
    if (searchState) {
      query = query.ilike("state", `%${searchState}%`);
    }

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (!error && data) {
      setDoctors(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  // Re-fetch whenever filters or page change
  useEffect(() => {
    fetchDoctors();
  }, [selectedCategory, searchName, searchCity, searchState, currentPage]);

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchCity, searchState, selectedCategory, showOnlyFavorites]);

  // Toggle Favorite Function
  const toggleFavorite = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updatedFavs: string[];
    if (favorites.includes(docId)) {
      updatedFavs = favorites.filter((id) => id !== docId);
    } else {
      updatedFavs = [...favorites, docId];
    }
    setFavorites(updatedFavs);
    localStorage.setItem("mdscout_favs", JSON.stringify(updatedFavs));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorForInquiry) return;
    setSubmittingInquiry(true);
    setInquirySuccess("");

    try {
      const docName = selectedDoctorForInquiry.first_name && selectedDoctorForInquiry.last_name
        ? `Dr. ${selectedDoctorForInquiry.first_name} ${selectedDoctorForInquiry.last_name}`
        : selectedDoctorForInquiry.name || "Doctor";

      const { error } = await supabase.from("inquiries").insert({
        doctor_id: String(selectedDoctorForInquiry.id),
        doctor_name: docName,
        sender_name: senderName || "Patient / Visitor",
        sender_email: senderEmail,
        inquiry_type: inquiryType,
        message: message,
      });

      if (error) throw error;

      setInquirySuccess("Your inquiry has been sent successfully!");
      setMessage("");
      setTimeout(() => {
        setSelectedDoctorForInquiry(null);
        setInquirySuccess("");
      }, 1800);
    } catch (err: any) {
      alert("Error sending inquiry: " + err.message);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Favorites-only filtering happens client-side (on the current page's data)
  const filteredDoctors = showOnlyFavorites
    ? doctors.filter((doc) => favorites.includes(String(doc.id)))
    : doctors;

  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const paginatedDoctors = filteredDoctors;

  const categories = [
    "Primary Care",
    "Cardiology",
    "Dermatology",
    "Pediatrics",
    "Neurology",
    "Dentistry",
    "Orthopedics",
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      {/* Top Navbar */}
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5 border ${
                showOnlyFavorites
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="text-red-500">❤️</span>
              Favorites ({favorites.length})
            </button>

            <span className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Official US NPI Registry
            </span>

            {user ? (
              <button
                onClick={handleSignOut}
                className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center max-w-3xl mx-auto pt-4 pb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3.5 py-1 rounded-full mb-4">
            🛡️ Trusted Nationwide Healthcare Finder
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Find Top Doctors & Clinics Near You in Seconds
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Search licensed physicians, pediatricians, dentists, and specialists across all US states with verified credentials.
          </p>

          {/* Search Inputs */}
          <div className="mt-8 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Doctor Name, Specialty, or NPI"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="flex-1 px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none rounded-xl bg-slate-50 sm:bg-white border sm:border-none border-slate-200"
            />
            <input
              type="text"
              placeholder="City (e.g., Brooklyn)"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full sm:w-44 px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none rounded-xl bg-slate-50 sm:bg-white border sm:border-none border-slate-200 sm:border-l sm:border-slate-200"
            />
            <input
              type="text"
              placeholder="STATE (E.G. NY)"
              value={searchState}
              onChange={(e) => setSearchState(e.target.value)}
              className="w-full sm:w-36 px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none rounded-xl bg-slate-50 sm:bg-white border sm:border-none border-slate-200 sm:border-l sm:border-slate-200 uppercase"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition shadow-md">
              Find Doctors
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-10 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">
              Browse Healthcare by Category
            </h2>
            {showOnlyFavorites && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                Showing Favorites Only
              </span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === "All"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All Specialists
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Listing */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-medium">
            Loading Official NPI Registered Doctors...
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Verified Directory ({totalCount} Found)
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Page {currentPage} of {totalPages || 1}
              </span>
            </div>

            {paginatedDoctors.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedDoctors.map((doc) => {
                    const docIdStr = String(doc.id);
                    const isFav = favorites.includes(docIdStr);

                    const doctorName = doc.first_name && doc.last_name
                      ? `Dr. ${doc.first_name} ${doc.last_name}`
                      : doc.first_name
                      ? `Dr. ${doc.first_name}`
                      : doc.name || "Specialist Doctor";

                    const doctorSpecialty = doc.specialty || doc.specialization || "General Medicine";
                    const doctorLocation = doc.location || doc.city || doc.address || "Verified Center";
                    const doctorPhone = doc.phone || doc.phone_number || doc.contact;

                    return (
                      <div
                        key={doc.id}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between relative group hover:border-blue-300 transition"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <h3
                                onClick={() => setViewDoctorProfile(doc)}
                                className="font-bold text-slate-900 text-base hover:text-blue-600 transition cursor-pointer hover:underline decoration-blue-500 underline-offset-2 pr-6"
                              >
                                {doctorName}
                              </h3>
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md inline-block mt-1">
                                {doctorSpecialty}
                              </span>
                            </div>

                            <button
                              onClick={(e) => toggleFavorite(docIdStr, e)}
                              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition border border-slate-100"
                              title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                            >
                              <span className={`text-base transition-transform active:scale-125 ${isFav ? "scale-110" : "opacity-40 hover:opacity-100"}`}>
                                {isFav ? "❤️" : "🤍"}
                              </span>
                            </button>
                          </div>

                          <div className="text-xs text-slate-600 space-y-2 mt-4">
                            <p className="flex items-center gap-2">
                              <span>📍</span> {doctorLocation}
                            </p>

                            {doctorPhone && (
                              <p className="flex items-center gap-2 font-medium text-slate-800">
                                <span>📞</span> {doctorPhone}
                              </p>
                            )}

                            {doc.npi_number && (
                              <p className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                                NPI: {doc.npi_number}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => setSelectedDoctorForInquiry(doc)}
                            className="text-xs font-semibold bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 px-3.5 py-2 rounded-lg transition"
                          >
                            Send Inquiry / Contact →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center items-center gap-2">
                    <button
                      onClick={() => changePage(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 border rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition shadow-sm"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs font-bold text-slate-600 px-3">
                      Page {currentPage} of {totalPages}
                    </span>
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
                {showOnlyFavorites
                  ? "No favorite doctors added yet. Click 🤍 on any doctor card to add them!"
                  : "No healthcare providers found matching your search criteria."}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Profile View Modal */}
      {viewDoctorProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border">
            <button
              onClick={() => setViewDoctorProfile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 font-black text-xl rounded-full flex items-center justify-center mx-auto mb-3">
                {viewDoctorProfile.first_name ? viewDoctorProfile.first_name[0] : "D"}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {viewDoctorProfile.first_name ? `Dr. ${viewDoctorProfile.first_name} ${viewDoctorProfile.last_name || ""}` : viewDoctorProfile.name || "Doctor"}
              </h3>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mt-1">
                {viewDoctorProfile.specialty || viewDoctorProfile.specialization || "General Specialist"}
              </span>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200 text-slate-700">
              <p className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Location:</span>
                <span className="font-medium text-slate-900">{viewDoctorProfile.location || viewDoctorProfile.city || "N/A"}</span>
              </p>
              <p className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Phone Contact:</span>
                <span className="font-medium text-slate-900">{viewDoctorProfile.phone || viewDoctorProfile.phone_number || viewDoctorProfile.contact || "N/A"}</span>
              </p>
              {viewDoctorProfile.npi_number && (
                <p className="flex justify-between">
                  <span className="font-semibold text-slate-500">NPI Number:</span>
                  <span className="font-mono text-slate-900">{viewDoctorProfile.npi_number}</span>
                </p>
              )}
            </div>

            <button
              onClick={() => {
                const doc = viewDoctorProfile;
                setViewDoctorProfile(null);
                setSelectedDoctorForInquiry(doc);
              }}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
            >
              Send Direct Inquiry →
            </button>
          </div>
        </div>
      )}

      {/* Inquiry Form Modal */}
      {selectedDoctorForInquiry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border">
            <button
              onClick={() => setSelectedDoctorForInquiry(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Contact {selectedDoctorForInquiry.first_name ? `Dr. ${selectedDoctorForInquiry.first_name} ${selectedDoctorForInquiry.last_name || ""}` : "Doctor"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Send a direct message or appointment inquiry.
            </p>

            {inquirySuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 text-center">
                {inquirySuccess}
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="patient@example.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Inquiry Type
                  </label>
                  <select
                    value={inquiryType}
                    onChange={(e) => setInquiryType(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="General Query">General Query</option>
                    <option value="Appointment Request">Appointment Request</option>
                    <option value="Second Opinion">Second Opinion</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your medical query or preferred appointment time..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-md disabled:opacity-50"
                >
                  {submittingInquiry ? "Sending Inquiry..." : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}