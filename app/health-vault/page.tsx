"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface FamilyMember {
  id: string;
  name: string;
  relation: string | null;
}

interface HealthDocument {
  id: string;
  title: string;
  file_url: string;
  file_type: string | null;
  family_member_id: string | null;
  uploaded_at: string;
}

export default function HealthVaultPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [patientPlan, setPatientPlan] = useState<string>("free");

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [memberName, setMemberName] = useState("");
  const [memberRelation, setMemberRelation] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docMemberId, setDocMemberId] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const isPlus = patientPlan === "plus";
  const FREE_DOC_LIMIT = 3;

  useEffect(() => {
    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("patient_plan")
          .eq("id", currentUser.id)
          .single();
        setPatientPlan(profile?.patient_plan || "free");
      }
      setAuthLoading(false);
    }
    init();
  }, []);

  async function fetchData(userId: string) {
    setLoading(true);
    const [membersRes, docsRes] = await Promise.all([
      supabase.from("family_members").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("health_documents").select("*").eq("user_id", userId).order("uploaded_at", { ascending: false }),
    ]);
    if (membersRes.data) setMembers(membersRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchData(user.id);
  }, [user]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !isPlus) return;
    setAddingMember(true);
    try {
      const { error } = await supabase.from("family_members").insert({
        user_id: user.id,
        name: memberName,
        relation: memberRelation || null,
      });
      if (error) throw error;
      setMemberName("");
      setMemberRelation("");
      fetchData(user.id);
    } catch (err: any) {
      alert("Error adding family member: " + err.message);
    } finally {
      setAddingMember(false);
    }
  }

  async function handleDeleteMember(id: string) {
    if (!user) return;
    await supabase.from("family_members").delete().eq("id", id);
    fetchData(user.id);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !docFile) return;

    if (!isPlus && documents.length >= FREE_DOC_LIMIT) {
      alert(`Free plan allows up to ${FREE_DOC_LIMIT} documents. Upgrade to MDScout Plus for unlimited storage.`);
      return;
    }

    setUploading(true);
    try {
      const fileExt = docFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("health-documents")
        .upload(filePath, docFile);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("health_documents").insert({
        user_id: user.id,
        family_member_id: docMemberId || null,
        title: docTitle || docFile.name,
        file_url: filePath,
        file_type: docFile.type,
      });
      if (insertError) throw insertError;

      setDocTitle("");
      setDocFile(null);
      setDocMemberId("");
      fetchData(user.id);
    } catch (err: any) {
      alert("Error uploading document: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(doc: HealthDocument) {
    if (!user) return;
    await supabase.storage.from("health-documents").remove([doc.file_url]);
    await supabase.from("health_documents").delete().eq("id", doc.id);
    fetchData(user.id);
  }

  async function handleDownload(doc: HealthDocument) {
    const { data, error } = await supabase.storage
      .from("health-documents")
      .createSignedUrl(doc.file_url, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      alert("Could not open file.");
    }
  }

  function memberName_(id: string | null) {
    if (!id) return "Myself";
    return members.find((m) => m.id === id)?.name || "Unknown";
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Sign in required</h1>
          <p className="text-sm text-slate-500 mb-6">Please sign in to use the Health Vault.</p>
          <Link href="/login?redirect=/health-vault" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

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
            <Link href="/health-tracker" className="hover:text-blue-600 transition-colors">Health Tracker</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50/60 to-transparent border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3.5 py-1 rounded-full mb-4">
            {isPlus ? "✨ MDScout Plus — Unlimited Storage & Family Profiles" : `💙 Free — Up to ${FREE_DOC_LIMIT} Documents`}
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Health <span className="text-blue-600">Vault</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Securely store and organize medical reports, prescriptions, and lab results for you and your family.
          </p>
          {!isPlus && (
            <div className="mt-4 bg-white border border-blue-200 rounded-xl p-3 text-xs text-slate-600 inline-flex items-center gap-2">
              🔒 Free plan: {documents.length}/{FREE_DOC_LIMIT} documents used, no family profiles.{" "}
              <Link href="/plus" className="font-bold text-blue-600 hover:underline">
                Upgrade to MDScout Plus
              </Link>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Family Members Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">👨‍👩‍👧 Family Profiles</h2>

          {isPlus ? (
            <>
              <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
                <input
                  type="text"
                  required
                  placeholder="Name (e.g. Ahmed)"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="flex-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Relation (e.g. Son)"
                  value={memberRelation}
                  onChange={(e) => setMemberRelation(e.target.value)}
                  className="flex-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={addingMember}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-lg text-sm transition disabled:opacity-50"
                >
                  Add
                </button>
              </form>

              {members.length === 0 ? (
                <p className="text-xs text-slate-400">No family members added yet.</p>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800">
                        {m.name} {m.relation && <span className="text-slate-400">({m.relation})</span>}
                      </span>
                      <button onClick={() => handleDeleteMember(m.id)} className="text-slate-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-slate-500 mb-2">Family profiles are a MDScout Plus feature.</p>
              <Link href="/plus" className="text-xs font-bold text-blue-600 hover:underline">
                Upgrade to add family members →
              </Link>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">📄 Upload Document</h2>

          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g. Blood Test - Jan 2026"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isPlus && members.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">For</label>
                <select
                  value={docMemberId}
                  onChange={(e) => setDocMemberId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Myself</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">File (PDF or image)</label>
              <input
                type="file"
                accept=".pdf,image/*"
                required
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || (!isPlus && documents.length >= FREE_DOC_LIMIT)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">📁 Your Documents</h2>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">No documents yet. Upload your first one above.</div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <button onClick={() => handleDownload(doc)} className="text-left text-xs flex-1">
                    <p className="font-semibold text-slate-800 hover:text-blue-600">📄 {doc.title}</p>
                    <p className="text-slate-400 mt-0.5">
                      For: {memberName_(doc.family_member_id)} · {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </button>
                  <button onClick={() => handleDeleteDocument(doc)} className="text-slate-400 hover:text-red-600 text-xs px-2">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}