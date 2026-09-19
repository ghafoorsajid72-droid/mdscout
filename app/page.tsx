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
const COMMON_INSURANCES = [
  "Aetna",
  "Blue Cross Blue Shield",
  "Cigna",
  "UnitedHealthcare",
  "Medicare",
  "Medicaid",
  "Humana",
  "Kaiser Permanente",
];
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
  const [selectedInsurance, setSelectedInsurance] = useState<string>("");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const itemsPerPage = 24;

  const [nearMeActive, setNearMeActive] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  const [viewDoctorProfile, setViewDoctorProfile] = useState<any>(null);
  const [selectedDoctorForInquiry, setSelectedDoctorForInquiry] = useState<any>(null);
  const [claimingDoctor, setClaimingDoctor] = useState<any>(null);
  const [claimNpiInput, setClaimNpiInput] = useState<string>("");
  const [claimMessage, setClaimMessage] = useState<string>("");
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<string>("");

  const [doctorReviews, setDoctorReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [newRating, setNewRating] = useState<number>(0);
  const [newReviewText, setNewReviewText] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewMessage, setReviewMessage] = useState<string>("");

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

  function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 3958.8; // Earth radius in miles
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

    // NEAR ME MODE: fetch a larger batch with valid coordinates, sort client-side by distance
    if (nearMeActive && userLocation) {
      let nearQuery = supabase
        .from("doctors")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .neq("latitude", 0);

      if (selectedCategory !== "All") {
        nearQuery = nearQuery.ilike("specialty", `%${selectedCategory}%`);
      }
      if (searchName) {
        const nameParts = searchName.trim().replace(/^dr\.?\s+/i, "").split(/\s+/);
        if (nameParts.length > 1) {
          nearQuery = nearQuery
            .ilike("first_name", `%${nameParts[0]}%`)
            .ilike("last_name", `%${nameParts[nameParts.length - 1]}%`);
        } else {
          nearQuery = nearQuery.or(
            `first_name.ilike.%${searchName}%,last_name.ilike.%${searchName}%,npi_number.ilike.%${searchName}%,specialty.ilike.%${searchName}%`
          );
        }
      }
      if (searchState) {
        nearQuery = nearQuery.ilike("state", `%${searchState}%`);
      }
      if (selectedInsurance) {
        nearQuery = nearQuery.ilike("insurance_accepted", `%${selectedInsurance}%`);
      }

      nearQuery = nearQuery.limit(2000);

      const { data, error } = await nearQuery;
      if (!error && data) {
        const withDistance = data
          .map((doc) => ({
            ...doc,
            distanceMiles: getDistanceMiles(
              userLocation.lat,
              userLocation.lng,
              doc.latitude,
              doc.longitude
            ),
          }))
          .sort((a, b) => a.distanceMiles - b.distanceMiles);

        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage;
        setDoctors(withDistance.slice(from, to));
        setTotalCount(withDistance.length);
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
      const cleanedName = searchName.trim().replace(/^dr\.?\s+/i, "");
      const nameParts = cleanedName.split(/\s+/).filter(Boolean);
      if (nameParts.length > 1) {
        query = query
          .ilike("first_name", `%${nameParts[0]}%`)
          .ilike("last_name", `%${nameParts[nameParts.length - 1]}%`);
      } else {
        query = query.or(
          `first_name.ilike.%${cleanedName}%,last_name.ilike.%${cleanedName}%,npi_number.ilike.%${cleanedName}%,specialty.ilike.%${cleanedName}%`
        );
      }
    }
    if (searchCity) {
      query = query.ilike("city", `%${searchCity}%`);
    }
    if (searchState) {
      query = query.ilike("state", `%${searchState}%`);
    }
    if (selectedInsurance) {
      query = query.ilike("insurance_accepted", `%${selectedInsurance}%`);
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
  }, [selectedCategory, searchName, searchCity, searchState, selectedInsurance, currentPage, showOnlyFavorites, nearMeActive, userLocation]);

  useEffect(() => {
    if (searchCity.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      let cityQuery = supabase
        .from("doctors")
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
  }, [searchName, searchCity, searchState, selectedCategory, selectedInsurance, showOnlyFavorites]);

  useEffect(() => {
    const anyModalOpen = viewDoctorProfile || selectedDoctorForInquiry || claimingDoctor;
    document.body.style.overflow = anyModalOpen ? "hidden" : "unset";
    document.documentElement.style.overflow = anyModalOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, [viewDoctorProfile, selectedDoctorForInquiry, claimingDoctor]);

  useEffect(() => {
    async function fetchReviews() {
      if (!viewDoctorProfile?.npi_number) {
        setDoctorReviews([]);
        return;
      }
      setReviewsLoading(true);
      const { data, error } = await supabase
        .from("doctor_reviews")
        .select("*")
        .eq("doctor_npi", viewDoctorProfile.npi_number)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setDoctorReviews(data);
      }
      setReviewsLoading(false);
    }
    fetchReviews();
    setNewRating(0);
    setNewReviewText("");
    setReviewMessage("");
  }, [viewDoctorProfile]);

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

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingDoctor || !user) return;
    setSubmittingClaim(true);
    setClaimSuccess("");

    try {
      const { error } = await supabase.from("claim_requests").insert({
        doctor_id: claimingDoctor.id,
        user_id: user.id,
        npi_entered: claimNpiInput,
        message: claimMessage,
      });

      if (error) throw error;

      setClaimSuccess("Your claim request has been submitted! We'll review it and get back to you.");
      setClaimNpiInput("");
      setClaimMessage("");
      setTimeout(() => {
        setClaimingDoctor(null);
        setClaimSuccess("");
      }, 2000);
    } catch (err: any) {
      alert("Error submitting claim: " + err.message);
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in first to leave a review.");
      return;
    }
    if (!viewDoctorProfile?.npi_number || newRating === 0) return;
    setSubmittingReview(true);
    setReviewMessage("");

    try {
      const { error } = await supabase.from("doctor_reviews").upsert(
        {
          doctor_npi: viewDoctorProfile.npi_number,
          user_id: user.id,
          rating: newRating,
          review_text: newReviewText || null,
        },
        { onConflict: "doctor_npi,user_id" }
      );

      if (error) throw error;

      setReviewMessage("Thank you! Your review has been posted.");
      setNewReviewText("");

      const { data } = await supabase
        .from("doctor_reviews")
        .select("*")
        .eq("doctor_npi", viewDoctorProfile.npi_number)
        .order("created_at", { ascending: false });
      if (data) setDoctorReviews(data);
    } catch (err: any) {
      alert("Error submitting review: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

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
            <Link href="/hospitals" className="hover:text-blue-600 transition-colors">Hospitals</Link>
            <Link href="/health-news" className="hover:text-blue-600 transition-colors">Health News</Link>
            <Link href="/health-tracker" className="hover:text-blue-600 transition-colors">Health Tracker</Link>
            <Link href="/appointments" className="hover:text-blue-600 transition-colors">Appointments</Link>
            {user && <Link href="/doctor-dashboard" className="hover:text-blue-600 transition-colors">Doctor Dashboard</Link>}
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
        <Link href="/hospitals" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50">
          🏥 Find Hospitals
        </Link>
        <Link href="/health-news" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50">
          📰 Health News
        </Link>
        <Link href="/health-tracker" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50">
          💙 Health Tracker
        </Link>
        <Link href="/appointments" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50">
          📅 Appointments
        </Link>
        {user && (
          <Link href="/doctor-dashboard" onClick={() => setShowMobileMenu(false)} className="px-3 py-2.5 rounded-lg hover:bg-slate-50">
            👨‍⚕️ Doctor Dashboard
          </Link>
        )}
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
              <div className="relative w-full sm:w-44">
                <input
                  type="text"
                  placeholder="City (e.g., Brooklyn)"
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
              <input
                type="text"
                placeholder="STATE (E.G. NY)"
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                maxLength={2}
                className="w-full sm:w-32 px-4 py-2 text-xs sm:text-sm text-slate-900 outline-none rounded-xl bg-slate-50 sm:bg-white border sm:border-none border-slate-200 sm:border-l sm:border-slate-200 uppercase"
              />
              <button
                onClick={() => {
                  const section = document.getElementById("directory-section");
                  if (section) {
                    const yOffset = -90;
                    const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-md"
              >
                Find Doctors
              </button>
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

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">✅ 100% Verified NPI Data</span>
              <span className="flex items-center gap-1.5">🔄 Updated Daily</span>
              <span className="flex items-center gap-1.5">🔒 Secure & Reliable</span>
            </div>
          </div>

          <div className="hidden lg:block relative z-0 ml-16">
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
                    setSelectedInsurance("");
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="mb-4 relative">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Location</label>
                <input
                  type="text"
                  placeholder="City or ZIP code"
                  value={searchCity}
                  onChange={(e) => {
                    setSearchCity(e.target.value);
                    setShowCitySuggestions(true);
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 250)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="mb-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Insurance</label>
                <select
                  value={selectedInsurance}
                  onChange={(e) => setSelectedInsurance(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Any Insurance</option>
                  {COMMON_INSURANCES.map((ins) => (
                    <option key={ins} value={ins}>{ins}</option>
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
                    {selectedInsurance && (
                      <span className="text-blue-600"> · Accepting {selectedInsurance}</span>
                    )}
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

                                {nearMeActive && typeof doc.distanceMiles === "number" && (
                                  <p className="flex items-center gap-2 font-semibold text-emerald-600">
                                    <span>📍</span> {doc.distanceMiles.toFixed(1)} miles away
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                            <button
                                onClick={() => setViewDoctorProfile(doc)}
                                className="flex-1 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95"
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => setSelectedDoctorForInquiry(doc)}
                                className="flex-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95"
                              >
                                Contact
                              </button>
                              {doc.latitude && doc.latitude !== 0 && (
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${doc.latitude},${doc.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 text-center"
                                >
                                  🧭 Directions
                                </a>
                              )}
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
                      : selectedInsurance
                      ? `No doctors found who accept ${selectedInsurance} matching your other filters. Try a different insurance or clear filters.`
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative border">
            <button
              onClick={() => setViewDoctorProfile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              {viewDoctorProfile.photo_url ? (
                <img
                  src={viewDoctorProfile.photo_url}
                  alt="Doctor"
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-100 text-blue-600 font-black text-xl rounded-full flex items-center justify-center mx-auto mb-3">
                  {viewDoctorProfile.first_name ? viewDoctorProfile.first_name[0] : "D"}
                </div>
              )}
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

            {viewDoctorProfile.bio && (
              <div className="mb-3 p-3 bg-blue-50 rounded-xl text-xs text-slate-700 border border-blue-100">
                {viewDoctorProfile.bio}
              </div>
            )}

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200 text-slate-700">
              <p className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Location:</span>
                <span className="font-medium text-slate-900">{viewDoctorProfile.city && viewDoctorProfile.state ? `${viewDoctorProfile.city}, ${viewDoctorProfile.state}` : "N/A"}</span>
              </p>
              <p className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Phone Contact:</span>
                <span className="font-medium text-slate-900">{viewDoctorProfile.phone || viewDoctorProfile.phone_number || viewDoctorProfile.contact || "N/A"}</span>
              </p>
              {viewDoctorProfile.working_hours && (
                <p className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-slate-500">Working Hours:</span>
                  <span className="font-medium text-slate-900">{viewDoctorProfile.working_hours}</span>
                </p>
              )}
              {viewDoctorProfile.insurance_accepted && (
                <p className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-slate-500">Insurance:</span>
                  <span className="font-medium text-slate-900 text-right">{viewDoctorProfile.insurance_accepted}</span>
                </p>
              )}
              {viewDoctorProfile.npi_number && (
                <p className="flex justify-between">
                  <span className="font-semibold text-slate-500">NPI Number:</span>
                  <span className="font-mono text-slate-900">{viewDoctorProfile.npi_number}</span>
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800">Patient Reviews</h4>
                {doctorReviews.length > 0 && (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    ⭐ {(doctorReviews.reduce((sum, r) => sum + r.rating, 0) / doctorReviews.length).toFixed(1)} ({doctorReviews.length})
                  </span>
                )}
              </div>

              {reviewsLoading ? (
                <p className="text-xs text-slate-400">Loading reviews...</p>
              ) : doctorReviews.length === 0 ? (
                <p className="text-xs text-slate-400 mb-3">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {doctorReviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1 text-amber-500 text-xs mb-1">
                        {"⭐".repeat(rev.rating)}
                      </div>
                      {rev.review_text && <p className="text-xs text-slate-600">{rev.review_text}</p>}
                    </div>
                  ))}
                </div>
              )}

              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className={`text-2xl leading-none cursor-pointer transition-transform duration-100 hover:scale-125 active:scale-95 p-1 ${star <= newRating ? "text-amber-500" : "text-slate-300 hover:text-amber-300"}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Share your experience (optional)..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {reviewMessage && (
                    <p className="text-xs text-emerald-600 font-semibold">{reviewMessage}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submittingReview || newRating === 0}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-xs transition disabled:opacity-50"
                  >
                    {submittingReview ? "Posting..." : "Post Review"}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-slate-400">
                  <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link> to leave a review.
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

            {!viewDoctorProfile.claimed_by && (
              <button
              onClick={() => {
                if (!user) {
                  alert("Please sign in first to claim your profile.");
                  return;
                }
                setClaimingDoctor(viewDoctorProfile);
                setViewDoctorProfile(null);
              }}
              className="w-full mt-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95"
            >
              👨‍⚕️ Is this you? Claim this profile
            </button>
            )}
          </div>
        </div>
      )}

      {selectedDoctorForInquiry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative border">
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

      {claimingDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border">
            <button
              onClick={() => setClaimingDoctor(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Claim Profile: {claimingDoctor.first_name ? `Dr. ${claimingDoctor.first_name} ${claimingDoctor.last_name || ""}` : "Doctor"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Confirm your NPI number to request ownership of this profile. Our team will verify and approve your request.
            </p>

            {claimSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 text-center">
                {claimSuccess}
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Confirm NPI Number ({claimingDoctor.npi_number})
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Re-enter the NPI number shown above"
                    value={claimNpiInput}
                    onChange={(e) => setClaimNpiInput(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Additional Information (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Let us know anything that helps verify this is your profile..."
                    value={claimMessage}
                    onChange={(e) => setClaimMessage(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-md disabled:opacity-50"
                >
                  {submittingClaim ? "Submitting..." : "Submit Claim Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

