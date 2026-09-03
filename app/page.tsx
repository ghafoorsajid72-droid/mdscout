"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY"
];

const SPECIALTY_ICONS: Record<string, string> = {
  "All": "🩺",
  "Primary Care": "👤",
  "Cardiology": "❤️",
  "Dermatology": "🧴",
  "Pediatrics": "👶",
  "Neurology": "🧠",
  "Dentistry": "🦷",
  "Orthopedics": "🦴",
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);

  const [searchName, setSearchName] = useState<string>("");
  const [searchCity, setSearchCity] = useState<string>("");
  const [searchState, setSearchState] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const itemsPerPage = 24;

  const [viewDoctorProfile, setViewDoctorProfile] = useState<any>(null);
  const [selectedDoctorForInquiry, setSelectedDoctorForInquiry] = useState<any>(null);

  const [inquiryType, setInquiryType] = useState<string>("General Query");
  const [message, setMessage] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("");
  const [senderEmail, setSenderEmail] = useState<string>("");
  const [submittingInquiry, setSubmittingInquiry] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<string>("");

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

  async function fetchDoctors() {
    setLoading(true);

    // FAVORITES MODE: fetch only the doctors saved as favorites
    if (showOnlyFavorites) {
      if (favorites.length === 0) {
        setDoctors([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .in("id", favorites);

      if (!error && data) {
        setDoctors(data);
        setTotalCount(data.length);
      }
      setLoading(false);
      return;
    }

    // NORMAL MODE: server-side filtered + paginated search
    let query = supabase.from("doctors").select("*", { count: "estimated" });

    if (selectedCategory !== "All") {
      query = query.ilike("specialty", `%${selectedCategory}%`);
    }
    if (searchName) {
      query = query.or(
        `first_name.ilike.%${searchName}%,last_name.ilike.%${searchName}%,npi_number.ilike.%${searchName}%,specialty.ilike.%${searchName}%`
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

  useEffect(() => {
    fetchDoctors();
  }, [selectedCategory, searchName, searchCity, searchState, currentPage, showOnlyFavorites]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchCity, searchState, selectedCategory, showOnlyFavorites]);

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

    // If viewing favorites only, remove the doctor card immediately
    if (showOnlyFavorites) {
      const remaining = updatedFavs.length;
      if (remaining === 0) {
        setShowOnlyFavorites(false);
      } else {
        setDoctors((prev) => prev.filter((doc) => String(doc.id) !== docId));
        setTotalCount((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  const [signOutMsg, setSignOutMsg] = useState<boolean>(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSignOutMsg(true);
    setTimeout(() => setSignOutMsg(false), 2000);
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

  const filteredDoctors = doctors;

    const changePage = (newPage: number) => {
      setCurrentPage(newPage);
      const section = document.getElementById("directory-section");
      if (section) {
        const yOffset = -90; // header ke liye thoda space chhodte hain
        const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
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
      {signOutMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg animate-pulse">
          ✓ Signed out successfully
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all duration-150 cursor-pointer hover:scale-110 active:scale-90"
              aria-label="Open menu"
            >
              <span className="block w-5 space-y-1.5">
                <span className="block h-0.5 bg-slate-700 rounded"></span>
                <span className="block h-0.5 bg-slate-700 rounded"></span>
                <span className="block h-0.5 bg-slate-700 rounded"></span>
              </span>
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                🛡️
              </div>
              <span className="text-xl font-extrabold text-blue-900 tracking-tight">
                MDScout<span className="text-blue-600">.io</span>
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
          <button
              onClick={() => {
                setShowOnlyFavorites(!showOnlyFavorites);
                setTimeout(() => {
                  const section = document.getElementById("directory-section");
                  if (section) {
                    const yOffset = -90;
                    const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                }, 100);
              }}
              className={`text-xs font-bold px-3 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 border cursor-pointer hover:scale-105 active:scale-95 ${
                showOnlyFavorites
                  ? "bg-red-50 text-red-600 border-red-200 shadow-sm"
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
                className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95"
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

{/* Mobile/Side Menu */}
{showMobileMenu && (
  <div className="fixed inset-0 z-50">
    <div
      className="absolute inset-0 bg-black/50"
      onClick={() => setShowMobileMenu(false)}
    ></div>
    <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <span className="font-extrabold text-blue-900 text-lg">
          MDScout<span className="text-blue-600">.io</span>
        </span>
        <button
          onClick={() => setShowMobileMenu(false)}
          className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition"
        >
          ✕
        </button>
      </div>

      <nav className="flex flex-col p-4 gap-1 text-sm font-medium text-slate-700">
        <Link href="/" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50">
          🏠 Find Doctors
        </Link>
        <button
          onClick={() => {
            setShowOnlyFavorites(!showOnlyFavorites);
            setShowMobileMenu(false);
          }}
          className="text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-all duration-150 cursor-pointer active:scale-95"
        >
          ❤️ Favorites ({favorites.length})
        </button>
        <Link href="/pricing" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50">
          💳 Pricing
        </Link>
        <Link href="/about" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50">
          ℹ️ About Us
        </Link>
        <Link href="/contact" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50">
          ✉️ Contact Us
        </Link>

        <div className="border-t border-slate-100 my-2"></div>

        <Link href="/admin" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50">
          🛠️ Admin Dashboard
        </Link>

        <div className="border-t border-slate-100 my-2"></div>

        <Link href="/privacy" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50 text-xs text-slate-400">
          Privacy Policy
        </Link>
        <Link href="/terms" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50 text-xs text-slate-400">
          Terms of Service
        </Link>
      </nav>

      <div className="mt-auto p-4 border-t border-slate-100">
        {user ? (
          <button
            onClick={() => {
              handleSignOut();
              setShowMobileMenu(false);
            }}
            className="w-full text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95"
          >
            Sign Out
          </button>
        ) : (
          <Link
            href="/login"
            onClick={() => setShowMobileMenu(false)}
            className="w-full block text-center text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition shadow-sm"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  </div>
)}

<section className="bg-gradient-to-b from-blue-50/60 to-transparent border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3.5 py-1 rounded-full mb-4">
              🛡️ Trusted Nationwide Healthcare Finder
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Find Top Doctors & Clinics <span className="text-blue-600">Near You</span> in Seconds
            </h1>

            <p className="mt-4 text-sm text-slate-500 max-w-xl">
              Search licensed physicians, specialists, and healthcare providers across all 50 states with verified NPI credentials.
            </p>
            <div className="mt-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Doctor Name, Specialty, or NPI"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="flex-1 px-4 py-2 text-xs sm:text-sm text-slate-900 outline-none rounded-xl bg-slate-50 sm:bg-white border sm:border-none border-slate-200"
              />
              <input
                type="text"
                placeholder="City (e.g., Brooklyn)"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full sm:w-44 px-4 py-2 text-xs sm:text-sm text-slate-900 outline-none rounded-xl bg-slate-50 sm:bg-white border sm:border-none border-slate-200 sm:border-l sm:border-slate-200"
              />
              <input
                type="text"
                placeholder="STATE (E.G. NY)"
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                maxLength={2}
                className="w-full sm:w-32 px-4 py-2 text-xs sm:text-sm text-slate-900 outline-none rounded-xl bg-slate-50 sm:bg-white border sm:border-none border-slate-200 sm:border-l sm:border-slate-200 uppercase"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-xs sm:text-sm transition shadow-md">
                Find Doctors
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">✅ 100% Verified NPI Data</span>
              <span className="flex items-center gap-1.5">🔄 Updated Daily</span>
              <span className="flex items-center gap-1.5">🔒 Secure & Reliable</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <img
              src="/mdscout_hero_final2.jpg"
              alt="Doctor consultation"
              className="rounded-2xl w-full h-auto object-contain shadow-xl"
            />
              </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Browse by Specialty</h2>
            {showOnlyFavorites && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                Showing Favorites Only
              </span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
              onClick={() => setSelectedCategory("All")}
              className={`flex flex-col items-center justify-center min-w-[92px] px-3 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 border cursor-pointer hover:scale-105 active:scale-95 ${
                selectedCategory === "All"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <span className="text-lg mb-1">{SPECIALTY_ICONS["All"]}</span>
              All Specialties
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-col items-center justify-center min-w-[92px] px-3 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 border cursor-pointer hover:scale-105 active:scale-95 ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <span className="text-lg mb-1">{SPECIALTY_ICONS[cat] || "🩺"}</span>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filter Results</h3>
                <button
                  onClick={() => {
                    setSearchCity("");
                    setSearchState("");
                    setSelectedCategory("All");
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="mb-4">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Location</label>
                <input
                  type="text"
                  placeholder="City or ZIP code"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">State</label>
                <select
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All States</option>
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Specialty</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="All">All Specialties</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          <div className="flex-1" id="directory-section">
          {loading ? (
              <div className="text-center py-20 text-slate-400 text-xs font-medium">
                Loading Official NPI Registered Doctors...
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Verified Directory ({totalCount.toLocaleString()} Found)
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                </div>

                {paginatedDoctors.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {paginatedDoctors.map((doc) => {
                        const docIdStr = String(doc.id);
                        const isFav = favorites.includes(docIdStr);

                        const doctorName = doc.first_name && doc.last_name
                          ? `Dr. ${doc.first_name} ${doc.last_name}`
                          : doc.first_name
                          ? `Dr. ${doc.first_name}`
                          : doc.name || "Specialist Doctor";

                        const initials = doc.first_name && doc.last_name
                          ? `${doc.first_name[0]}${doc.last_name[0]}`
                          : "DR";

                        const doctorSpecialty = doc.specialty || doc.specialization || "General Medicine";
                        const doctorLocation = doc.city && doc.state ? `${doc.city}, ${doc.state}` : (doc.location || doc.address || "Verified Center");
                        const doctorPhone = doc.phone || doc.phone_number || doc.contact;

                        return (
                          <div
                            key={doc.id}
                            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between relative group hover:border-blue-300 hover:shadow-md transition"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                                    {initials}
                                  </div>
                                  <div>
                                    <h3
                                      onClick={() => setViewDoctorProfile(doc)}
                                      className="font-bold text-slate-900 text-sm hover:text-blue-600 transition cursor-pointer leading-tight"
                                    >
                                      {doctorName}
                                    </h3>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                                      ✓ NPI Verified
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => toggleFavorite(docIdStr, e)}
                                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition border border-slate-100"
                                  title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                                >
                                  <span className={`text-base transition-transform active:scale-125 ${isFav ? "scale-110" : "opacity-40 hover:opacity-100"}`}>
                                    {isFav ? "❤️" : "🤍"}
                                  </span>
                                </button>
                              </div>

                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md inline-block mb-3">
                                {doctorSpecialty}
                              </span>

                              <div className="text-xs text-slate-600 space-y-1.5">
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

                            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                              <button
                                onClick={() => setViewDoctorProfile(doc)}
                                className="flex-1 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg transition"
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => setSelectedDoctorForInquiry(doc)}
                                className="flex-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition"
                              >
                                Contact
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-10 flex flex-col items-center gap-3">
                      <div className="flex justify-center items-center gap-1.5 flex-wrap">
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

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Go to page:</span>
                        <input
                          type="number"
                          min={1}
                          max={totalPages}
                          placeholder={String(currentPage)}
                          className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = parseInt((e.target as HTMLInputElement).value);
                              if (val >= 1 && val <= totalPages) {
                                changePage(val);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                          }}
                        />
                        <span>of {totalPages.toLocaleString()}</span>
                      </div>
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
          </div>
        </div>

        <section className="mt-16 bg-white rounded-2xl border border-slate-200 p-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3.5 py-1 rounded-full mb-3">
              🛡️ Trusted by Thousands
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Why Healthcare Professionals & Patients Trust <span className="text-blue-600">MDScout</span>
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              We provide accurate, verified, and up-to-date healthcare provider information sourced directly from the official NPI registry.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-lg font-black text-slate-900">100%</div>
              <div className="text-[11px] text-slate-500 font-medium">NPI Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔄</div>
              <div className="text-lg font-black text-slate-900">Daily</div>
              <div className="text-[11px] text-slate-500 font-medium">Updated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-lg font-black text-slate-900">800K+</div>
              <div className="text-[11px] text-slate-500 font-medium">Providers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-lg font-black text-slate-900">Secure</div>
              <div className="text-[11px] text-slate-500 font-medium">& Private</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">🛡️</div>
              <span className="font-extrabold text-blue-900">MDScout</span>
            </div>
            <p className="text-slate-500">Your trusted source for finding verified healthcare providers across the United States.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Quick Links</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>Find Doctors</li>
              <li>Specialties</li>
              <li>About Us</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Resources</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>NPI Registry</li>
              <li>For Patients</li>
              <li>For Providers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Contact</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>support@mdscout.io</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-[11px] text-slate-400">
          © 2026 MDScout.io. All rights reserved.
        </div>
      </footer>

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
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                  ✓ NPI Verified
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200 text-slate-700">
              <p className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Location:</span>
                <span className="font-medium text-slate-900">{viewDoctorProfile.city && viewDoctorProfile.state ? `${viewDoctorProfile.city}, ${viewDoctorProfile.state}` : "N/A"}</span>
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
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Your Name</label>
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
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Your Email</label>
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
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Inquiry Type</label>
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
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Message</label>
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
