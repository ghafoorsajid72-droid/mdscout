"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface HealthRecord {
  id: number;
  record_type: string;
  systolic: number | null;
  diastolic: number | null;
  sugar_level: number | null;
  medication_name: string | null;
  medication_time: string | null;
  notes: string | null;
  recorded_at: string;
}

export default function HealthTrackerPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>("free");

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"bp" | "sugar" | "medication">("bp");

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [sugarLevel, setSugarLevel] = useState("");
  const [medName, setMedName] = useState("");
  const [medTime, setMedTime] = useState("");
  const [reminderActive, setReminderActive] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", currentUser.id)
          .single();
        setUserPlan(profile?.plan || "free");
      }
      setAuthLoading(false);
    }
    init();
  }, []);

  async function fetchRecords() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("health_records")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setRecords(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchRecords();
  }, [user]);

  const hasAccess = userPlan === "pro" || userPlan === "advanced";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      let insertData: any = {
        user_id: user.id,
        record_type: activeTab === "bp" ? "blood_pressure" : activeTab === "sugar" ? "blood_sugar" : "medication",
        notes: notes || null,
      };

      if (activeTab === "bp") {
        insertData.systolic = parseInt(systolic);
        insertData.diastolic = parseInt(diastolic);
      } else if (activeTab === "sugar") {
        insertData.sugar_level = parseFloat(sugarLevel);
      } else {
        insertData.medication_name = medName;
        insertData.medication_time = medTime;
        insertData.reminder_active = reminderActive;
      }

      const { error } = await supabase.from("health_records").insert(insertData);
      if (error) throw error;

      setSystolic("");
      setDiastolic("");
      setSugarLevel("");
      setMedName("");
      setMedTime("");
      setReminderActive(false);
      setNotes("");
      fetchRecords();
    } catch (err: any) {
      alert("Error saving record: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await supabase.from("health_records").delete().eq("id", id);
    fetchRecords();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Sign in required</h1>
          <p className="text-sm text-slate-500 mb-6">Please sign in to use the Health Tracker.</p>
          <Link href="/login?redirect=/health-tracker" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Pro Feature</h1>
          <p className="text-sm text-slate-500 mb-6">
            Health Tracker (Blood Pressure, Blood Sugar & Medication reminders) is available on Pro and Advanced plans.
          </p>
          <Link href="/pricing" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">
            Upgrade to Pro
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
            <Link href="/hospitals" className="hover:text-blue-600 transition-colors">Hospitals</Link>
            <Link href="/health-news" className="hover:text-blue-600 transition-colors">Health News</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50/60 to-transparent border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3.5 py-1 rounded-full mb-4">
            💙 Pro Feature
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Health <span className="text-blue-600">Tracker</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track your blood pressure, blood sugar, and medication schedule.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setActiveTab("bp")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${activeTab === "bp" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              ❤️ Blood Pressure
            </button>
            <button
              onClick={() => setActiveTab("sugar")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${activeTab === "sugar" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              🩸 Blood Sugar
            </button>
            <button
              onClick={() => setActiveTab("medication")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${activeTab === "medication" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              💊 Medication
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {activeTab === "bp" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Systolic (top)</label>
                  <input
                    type="number"
                    required
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Diastolic (bottom)</label>
                  <input
                    type="number"
                    required
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "sugar" && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Blood Sugar (mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="95"
                  value={sugarLevel}
                  onChange={(e) => setSugarLevel(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {activeTab === "medication" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Medication Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metformin"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={medTime}
                    onChange={(e) => setMedTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="reminderActive"
                    checked={reminderActive}
                    onChange={(e) => setReminderActive(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <label htmlFor="reminderActive" className="text-xs font-semibold text-slate-600">
                    📧 Send me a daily email reminder for this medication
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Notes (optional)</label>
              <input
                type="text"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Record"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Recent History</h2>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs">Loading...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">No records yet. Add your first one above.</div>
          ) : (
            <div className="space-y-2">
              {records.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs">
                    {rec.record_type === "blood_pressure" && (
                      <p className="font-semibold text-slate-800">❤️ BP: {rec.systolic}/{rec.diastolic} mmHg</p>
                    )}
                    {rec.record_type === "blood_sugar" && (
                      <p className="font-semibold text-slate-800">🩸 Sugar: {rec.sugar_level} mg/dL</p>
                    )}
                    {rec.record_type === "medication" && (
                      <p className="font-semibold text-slate-800">💊 {rec.medication_name} at {rec.medication_time}</p>
                    )}
                    {rec.notes && <p className="text-slate-500 mt-0.5">{rec.notes}</p>}
                    <p className="text-slate-400 mt-0.5">{formatDate(rec.recorded_at)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="text-slate-400 hover:text-red-600 text-xs px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}