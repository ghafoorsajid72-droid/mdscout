"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DoctorDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [bio, setBio] = useState("");
  const [insuranceAccepted, setInsuranceAccepted] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setAuthLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchDoctor() {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("claimed_by", user.id)
        .maybeSingle();

      if (!error && data) {
        setDoctor(data);
        setBio(data.bio || "");
        setInsuranceAccepted(data.insurance_accepted || "");
        setWorkingHours(data.working_hours || "");
        setPhone(data.phone || data.phone_number || "");
      }
      setLoading(false);
    }
    fetchDoctor();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!doctor) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const { error } = await supabase
        .from("doctors")
        .update({
          bio,
          insurance_accepted: insuranceAccepted,
          working_hours: workingHours,
          phone,
        })
        .eq("id", doctor.id);

      if (error) throw error;
      setSaveMessage("Your profile has been updated successfully!");
    } catch (err: any) {
      alert("Error updating profile: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Sign in required</h1>
          <p className="text-sm text-slate-500 mb-6">Please sign in to access your doctor dashboard.</p>
          <Link href="/login?redirect=/doctor-dashboard" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">No Claimed Profile</h1>
          <p className="text-sm text-slate-500 mb-6">
            You haven't claimed a doctor profile yet. Find your listing and click "Is this you? Claim this profile" to get started.
          </p>
          <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">
            Browse Doctors
          </Link>
        </div>
      </div>
    );
  }

  const doctorName = doctor.first_name && doctor.last_name
    ? `Dr. ${doctor.first_name} ${doctor.last_name}`
    : doctor.name || "Doctor";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              🛡️
            </div>
            <span className="text-xl font-extrabold text-blue-900 tracking-tight">
              MDScout<span className="text-blue-600">.io</span>
            </span>
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50/60 to-transparent border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3.5 py-1 rounded-full mb-4">
            👨‍⚕️ Doctor Dashboard
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Manage Your <span className="text-blue-600">Profile</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Welcome, {doctorName}. Keep your profile up to date so patients can find accurate information.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Bio / About</label>
              <textarea
                rows={3}
                placeholder="Tell patients about your background, approach to care, and specialties..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Insurance Accepted</label>
              <input
                type="text"
                placeholder="e.g. Aetna, Blue Cross Blue Shield, Cigna, Medicare"
                value={insuranceAccepted}
                onChange={(e) => setInsuranceAccepted(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Separate multiple insurance providers with commas.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Working Hours</label>
              <input
                type="text"
                placeholder="e.g. Mon-Fri 9:00 AM - 5:00 PM"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Contact Phone</label>
              <input
                type="text"
                placeholder="e.g. (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {saveMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 text-center">
                {saveMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}