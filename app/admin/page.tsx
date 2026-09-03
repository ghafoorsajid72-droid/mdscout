"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"doctors" | "inquiries" | "claims">("doctors");
  const [claimRequests, setClaimRequests] = useState<any[]>([]);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAuthorized(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    setAuthorized(profile?.role === "admin");
  };

  // Add/Edit Form State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    specialty: "",
    city: "",
    state: "",
    phone: "",
    npi_number: "",
  });

  useEffect(() => {
    if (authorized) {
      fetchData();
    }
  }, [authorized]);

  const fetchData = async () => {
    setLoading(true);
    const { data: docsData } = await supabase.from("doctors").select("*").order("created_at", { ascending: false });
    const { data: inqData } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    const { data: claimsData } = await supabase.from("claim_requests").select("*").order("created_at", { ascending: false });

    if (docsData) setDoctors(docsData);
    if (inqData) setInquiries(inqData);
    if (claimsData) setClaimRequests(claimsData);
    setLoading(false);
  };

  const handleApproveClaim = async (claim: any) => {
    if (!confirm("Approve this claim? The doctor will be linked to this profile.")) return;
    await supabase.from("doctors").update({ claimed_by: claim.user_id }).eq("id", claim.doctor_id);
    await supabase.from("claim_requests").update({ status: "approved" }).eq("id", claim.id);
    fetchData();
  };

  const handleRejectClaim = async (claimId: any) => {
    if (!confirm("Reject this claim request?")) return;
    await supabase.from("claim_requests").update({ status: "rejected" }).eq("id", claimId);
    fetchData();
  };

  const handleOpenAdd = () => {
    setEditingDoc(null);
    setFormData({ first_name: "", last_name: "", specialty: "", city: "", state: "", phone: "", npi_number: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (doc: any) => {
    setEditingDoc(doc);
    setFormData({
      first_name: doc.first_name || "",
      last_name: doc.last_name || "",
      specialty: doc.specialty || doc.specialization || "",
      city: doc.city || doc.location || "",
      state: doc.state || "",
      phone: doc.phone || doc.phone_number || "",
      npi_number: doc.npi_number || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: any) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    await supabase.from("doctors").delete().eq("id", id);
    fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoc) {
      await supabase.from("doctors").update(formData).eq("id", editingDoc.id);
    } else {
      await supabase.from("doctors").insert(formData);
    }
    setShowModal(false);
    fetchData();
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Checking access...
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg font-bold text-slate-900">Access Denied</p>
        <p className="text-sm text-slate-500">This page is restricted to administrators only.</p>
        <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline mt-2">
          ← Back to MDScout
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans text-xs">
      {/* Compact Top Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-black text-sm tracking-tight flex items-center gap-1.5 text-blue-400">
              🛡️ MDScout<span className="text-white">Admin</span>
            </Link>
            <span className="bg-blue-900/60 text-blue-300 border border-blue-700/50 text-[10px] px-2 py-0.5 rounded font-mono">
              v1.2 Terminal
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="text-[11px] bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-slate-300 border border-slate-700 transition">
              ← Main Site
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
            <span className="text-slate-400 font-medium block text-[10px]">TOTAL DOCTORS</span>
            <span className="text-xl font-bold text-slate-900">{doctors.length}</span>
          </div>
          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
            <span className="text-slate-400 font-medium block text-[10px]">TOTAL INQUIRIES</span>
            <span className="text-xl font-bold text-blue-600">{inquiries.length}</span>
          </div>
          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
            <span className="text-slate-400 font-medium block text-[10px]">SYSTEM STATUS</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Connected (Supabase)
            </span>
          </div>
          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex items-center justify-end">
            <button
              onClick={handleOpenAdd}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1"
            >
              <span>+</span> Add Doctor
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-4 bg-white px-2 pt-2 rounded-t-xl border">
          <button
            onClick={() => setActiveTab("doctors")}
            className={`px-4 py-2 font-bold text-xs border-b-2 transition ${
              activeTab === "doctors"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Doctor Directory ({doctors.length})
          </button>
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`px-4 py-2 font-bold text-xs border-b-2 transition ${
              activeTab === "inquiries"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Patient Inquiries ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`px-4 py-2 font-bold text-xs border-b-2 transition ${
              activeTab === "claims"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Claim Requests ({claimRequests.filter((c) => c.status === "pending").length})
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl border text-slate-400">
            Loading database content...
          </div>
        ) : activeTab === "doctors" ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase">
                    <th className="p-3">Name</th>
                    <th className="p-3">Specialty</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">NPI</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {doctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">
                        {doc.first_name ? `Dr. ${doc.first_name} ${doc.last_name || ""}` : doc.name}
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded text-[10px]">
                          {doc.specialty || doc.specialization || "General"}
                        </span>
                      </td>
                      <td className="p-3">{doc.city || doc.location || "—"} {doc.state ? `, ${doc.state}` : ""}</td>
                      <td className="p-3 font-mono text-[11px]">{doc.phone || doc.phone_number || "—"}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">{doc.npi_number || "—"}</td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded text-[11px] font-semibold transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded text-[11px] font-semibold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "inquiries" ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase">
                    <th className="p-3">Doctor Target</th>
                    <th className="p-3">Sender Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-blue-900">{inq.doctor_name || "Doctor"}</td>
                      <td className="p-3 font-medium">{inq.sender_name}</td>
                      <td className="p-3 font-mono text-slate-500">{inq.sender_email}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                          {inq.inquiry_type}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-600">{inq.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase">
                    <th className="p-3">NPI Entered</th>
                    <th className="p-3">Message</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {claimRequests.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{claim.npi_entered}</td>
                      <td className="p-3 max-w-xs truncate text-slate-600">{claim.message || "—"}</td>
                      <td className="p-3">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            claim.status === "approved"
                              ? "bg-emerald-50 text-emerald-700"
                              : claim.status === "rejected"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {new Date(claim.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {claim.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApproveClaim(claim)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded text-[11px] font-semibold transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectClaim(claim.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded text-[11px] font-semibold transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              {editingDoc ? "Edit Doctor Information" : "Add New Doctor"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full p-2 border rounded text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full p-2 border rounded text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Specialty</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full p-2 border rounded text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2 border rounded text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">State (e.g. NY)</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-2 border rounded text-xs outline-none focus:border-blue-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border rounded text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">NPI Number</label>
                  <input
                    type="text"
                    value={formData.npi_number}
                    onChange={(e) => setFormData({ ...formData, npi_number: e.target.value })}
                    className="w-full p-2 border rounded text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-xs font-bold transition shadow-sm"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}