"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DoctorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myDoctor, setMyDoctor] = useState<any>(null);

  const [bio, setBio] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [insurance, setInsurance] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    loadMyProfile();
  }, []);

  async function loadMyProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("claimed_by", user.id)
      .maybeSingle();

    if (data) {
      setMyDoctor(data);
      setBio(data.bio || "");
      setWorkingHours(data.working_hours || "");
      setInsurance(data.insurance_accepted || "");
      setPhotoUrl(data.photo_url || "");
    }
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myDoctor) return;
    setSaving(true);
    setSaveMsg("");

    const { error } = await supabase
      .from("doctors")
      .update({
        bio,
        working_hours: workingHours,
        insurance_accepted: insurance,
        photo_url: photoUrl,
      })
      .eq("id", myDoctor.id);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      setSaveMsg("Profile updated successfully!");
      setTimeout(() => setSaveMsg(""), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  if (!myDoctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg font-bold text-slate-900">No Claimed Profile Found</p>
        <p className="text-sm text-slate-500 max-w-sm">
          You haven't claimed a doctor profile yet, or your claim request is still pending approval.
        </p>
        <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline mt-2">
          ← Back to MDScout
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-slate-900">My Doctor Profile</h1>
        <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-blue-600">
          ← Back to Site
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-black text-xl flex items-center justify-center flex-shrink-0">
              {myDoctor.first_name ? myDoctor.first_name[0] : "D"}
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                Dr. {myDoctor.first_name} {myDoctor.last_name}
              </h2>
              <p className="text-xs text-slate-500">{myDoctor.specialty}</p>
              <p className="text-xs text-slate-400 font-mono">NPI: {myDoctor.npi_number}</p>
            </div>
            {myDoctor.is_pro && (
              <span className="ml-auto text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                ⭐ Pro
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Edit Profile Details</h3>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Photo URL</label>
            <input
              type="url"
              placeholder="https://example.com/your-photo.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Bio</label>
            <textarea
              rows={4}
              placeholder="Tell patients about your experience, education, and approach to care..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Working Hours</label>
            <input
              type="text"
              placeholder="Mon-Fri 9AM-5PM"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Insurance Accepted</label>
            <input
              type="text"
              placeholder="Aetna, Blue Cross, Medicare, ..."
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {saveMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 text-center">
              {saveMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-md disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </main>
    </div>
  );
}