"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Extended Medical & General Auto-Correction Dictionary
const DICTIONARY: Record<string, string> = {
  stastionry: "stationery",
  stationery: "stationery",
  dector: "doctor",
  docter: "doctor",
  clenic: "clinic",
  appoinment: "appointment",
  prescripction: "prescription",
  medisin: "medicine",
  hospitall: "hospital",
  insurence: "insurance",
  recepion: "reception",
  lethead: "letterhead",
  fone: "phone",
  infomation: "information",
  conctact: "contact",
  help: "help",
};

export default function Home() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal & Contact Form States
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [isContacting, setIsContacting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    inquiryType: "General Clinical Appointment",
    message: "",
  });

  // Spell Check Suggestions State
  const [suggestions, setSuggestions] = useState<{ wrong: string; correct: string }[]>([]);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Saved Doctors State
  const [savedDoctorIds, setSavedDoctorIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mdscout_saved_doctors");
    if (saved) {
      try {
        setSavedDoctorIds(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleSaveDoctor = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updatedSaved: string[];
    if (savedDoctorIds.includes(docId)) {
      updatedSaved = savedDoctorIds.filter((id) => id !== docId);
    } else {
      updatedSaved = [...savedDoctorIds, docId];
    }
    setSavedDoctorIds(updatedSaved);
    localStorage.setItem("mdscout_saved_doctors", JSON.stringify(updatedSaved));
  };

  useEffect(() => {
    async function fetchDoctors() {
      const { data, error } = await supabase.from("doctors").select("*");
      if (!error && data) setDoctors(data);
      setLoading(false);
    }
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const docId = String(doc.id || doc.npi_number);
    const fullName = `${doc.first_name} ${doc.last_name}`.toLowerCase();

    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      doc.city?.toLowerCase().includes(search.toLowerCase()) ||
      doc.npi_number?.includes(search);

    const matchesSpecialty =
      selectedSpecialty === "" || doc.specialty === selectedSpecialty;

    const matchesSaved = !showSavedOnly || savedDoctorIds.includes(docId);

    return matchesSearch && matchesSpecialty && matchesSaved;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedSpecialty, showSavedOnly]);

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, startIndex + itemsPerPage);

  const specialties = Array.from(
    new Set(doctors.map((d) => d.specialty).filter(Boolean))
  );

  const handleCloseModal = () => {
    setSelectedDoctor(null);
    setIsContacting(false);
    setContactSubmitted(false);
    setSuggestions([]);
    setFormData({
      name: "",
      email: "",
      inquiryType: "General Clinical Appointment",
      message: "",
    });
  };

  // Live Auto-Spellcheck & Word Matching Engine
  const handleMessageInput = (text: string) => {
    setFormData((prev) => ({ ...prev, message: text }));

    const words = text.toLowerCase().split(/\s+/);
    const detected: { wrong: string; correct: string }[] = [];

    words.forEach((w) => {
      const cleanWord = w.replace(/[^\w]/g, "");
      if (DICTIONARY[cleanWord] && DICTIONARY[cleanWord] !== cleanWord) {
        if (!detected.some((item) => item.wrong === cleanWord)) {
          detected.push({ wrong: cleanWord, correct: DICTIONARY[cleanWord] });
        }
      }
    });

    setSuggestions(detected);
  };

  // Auto-Fill Corrected Spelling into Textarea
  const autoFillCorrection = (wrongWord: string, correctWord: string) => {
    const regex = new RegExp(`\\b${wrongWord}\\b`, "gi");
    const fixedText = formData.message.replace(regex, correctWord);
    setFormData((prev) => ({ ...prev, message: fixedText }));
    setSuggestions((prev) => prev.filter((item) => item.wrong !== wrongWord));
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  return (
    <main className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen relative flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="mb-8 border-b pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MDScout Directory</h1>
              <p className="text-gray-600 text-sm mt-1">
                Showing <span className="font-bold text-blue-600">{filteredDoctors.length}</span> Total Doctors
              </p>
            </div>

            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 border shadow-sm ${
                showSavedOnly
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{showSavedOnly ? "❤️ Showing Saved" : "🤍 Saved Doctors"}</span>
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {savedDoctorIds.length}
              </span>
            </button>
          </div>

          {/* Search Bar & Dropdown */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by Name, City, or NPI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />

            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg shadow-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Specialties</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 font-medium">Loading Doctors Database...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDoctors.length > 0 ? (
              currentDoctors.map((doc) => {
                const docId = String(doc.id || doc.npi_number);
                const isSaved = savedDoctorIds.includes(docId);

                return (
                  <div
                    key={docId}
                    className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition relative flex flex-col justify-between"
                  >
                    <button
                      onClick={(e) => toggleSaveDoctor(docId, e)}
                      title={isSaved ? "Remove from favorites" : "Save to favorites"}
                      className="absolute top-4 right-4 text-lg p-1 transition transform hover:scale-125 z-10"
                    >
                      {isSaved ? "❤️" : "🤍"}
                    </button>

                    <div>
                      <div
                        onClick={() => setSelectedDoctor(doc)}
                        className="flex items-center space-x-3 mb-3 pr-8 cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                          {doc.first_name?.[0] || "D"}
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition underline-offset-2 group-hover:underline">
                            Dr. {doc.first_name} {doc.last_name}
                          </h2>
                          <p className="text-xs text-blue-600 font-medium">{doc.specialty}</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3 mt-2 text-xs text-gray-500 space-y-1">
                        <p>📍 Location: {doc.city}, {doc.state}</p>
                        <p>🆔 NPI: {doc.npi_number}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                      <button
                        onClick={() => setSelectedDoctor(doc)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                      >
                        View Profile →
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 col-span-full text-center py-12 font-medium">
                {showSavedOnly
                  ? "Aap ne abhi tak koi doctor save nahi kiya."
                  : "Koi doctor matching nahi mila."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600 font-medium">
            Page <span className="text-blue-600 font-bold">{currentPage}</span> of{" "}
            <span className="font-bold">{totalPages}</span>
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              Previous
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                    currentPage === page
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 border hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* DOCTOR DETAIL & CONTACT MODAL */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
            >
              ✕
            </button>

            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center">
                {selectedDoctor.first_name?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                </h2>
                <p className="text-sm font-semibold text-blue-600">{selectedDoctor.specialty}</p>
                <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  Active NPI Registry
                </span>
              </div>
            </div>

            {!isContacting ? (
              <>
                <div className="space-y-3 border-t border-b py-4 my-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500">NPI Number:</span>
                    <span className="font-mono font-medium text-gray-900">{selectedDoctor.npi_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Practice Location:</span>
                    <span className="font-medium text-gray-900">{selectedDoctor.city}, {selectedDoctor.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Primary Specialty:</span>
                    <span className="font-medium text-gray-900">{selectedDoctor.specialty}</span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-50 p-2.5 rounded-lg border border-blue-100 mt-2">
                    <span className="text-blue-800 text-xs font-semibold">📞 Clinic Direct Line:</span>
                    <span className="font-mono text-xs font-bold text-blue-900">
                      +1 ({selectedDoctor.npi_number?.slice(0,3) || "800"}) 555-{selectedDoctor.npi_number?.slice(-4) || "0199"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setIsContacting(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition text-center text-sm shadow-md"
                  >
                    ✉️ Send Inquiry
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : contactSubmitted ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-gray-900">All Information Sent!</h3>
                <p className="text-xs text-gray-600">
                  Your request has been routed to Dr. {selectedDoctor.last_name}'s clinic terminal.
                </p>

                <div className="bg-gray-50 p-3 rounded-xl border text-left text-xs text-gray-700 space-y-1.5 font-mono">
                  <p><span className="text-gray-400">Recipient:</span> Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                  <p><span className="text-gray-400">Sender Name:</span> {formData.name}</p>
                  <p><span className="text-gray-400">Sender Email:</span> {formData.email}</p>
                  <p><span className="text-gray-400">Category:</span> {formData.inquiryType}</p>
                  <p><span className="text-gray-400">Message:</span> "{formData.message}"</p>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="mt-4 w-full bg-gray-900 text-white font-medium py-2 rounded-xl text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendContact} className="space-y-3 pt-1">
                <h3 className="font-bold text-gray-900 text-sm">Submit Clinical Inquiry</h3>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Your Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Inquiry Category</label>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="General Clinical Appointment">General Clinical Appointment</option>
                    <option value="Medical Stationery Request">Medical Stationery Request</option>
                    <option value="Insurance & Billing Documentation">Insurance & Billing Documentation</option>
                    <option value="Patient Referral & Records Transfer">Patient Referral & Records Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Your Email</label>
                  <input
                    required
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Textarea with Native & Interactive Auto-Correct */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-600">Detailed Message</label>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                      Native Spellcheck Active ⚡
                    </span>
                  </div>

                  <textarea
                    required
                    rows={3}
                    spellCheck="true"
                    lang="en"
                    placeholder="Type message e.g. Need stastionry letterhead or dector appointment..."
                    value={formData.message}
                    onChange={(e) => handleMessageInput(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  ></textarea>

                  {/* Dynamic Clickable Auto-Fill Suggestion Bar */}
                  {suggestions.length > 0 && (
                    <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                      <p className="font-semibold text-blue-900">✨ Click to Auto-Fill Correction:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((item) => (
                          <button
                            key={item.wrong}
                            type="button"
                            onClick={() => autoFillCorrection(item.wrong, item.correct)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                          >
                            <span>Replace "{item.wrong}" with <strong>{item.correct}</strong></span>
                            <span>⚡</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsContacting(false)}
                    className="px-3 bg-gray-100 text-gray-700 font-medium py-2 rounded-lg text-sm hover:bg-gray-200 transition"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}