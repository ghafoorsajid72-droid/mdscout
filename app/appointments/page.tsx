"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Appointment {
  id: number;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string | null;
  notes: string | null;
}

export default function AppointmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>("free");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [doctorName, setDoctorName] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
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

  async function fetchAppointments() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("doctor_appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("appointment_date", { ascending: true });

    if (!error && data) setAppointments(data);
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  const hasAccess = userPlan === "pro" || userPlan === "advanced";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from("doctor_appointments").insert({
        user_id: user.id,
        doctor_name: doctorName,
        appointment_date: apptDate,
        appointment_time: apptTime || null,
        notes: notes || null,
      });
      if (error) throw error;

      setDoctorName("");
      setApptDate("");
      setApptTime("");
      setNotes("");
      fetchAppointments();
    } catch (err: any) {
      alert("Error saving appointment: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await supabase.from("doctor_appointments").delete().eq("id", id);
    fetchAppointments();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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
          <p className="text-sm text-slate-500 mb-6">Please sign in to manage your appointments.</p>
          <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">
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
            Appointment reminders are available on Pro and Advanced plans.
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
            <Link href="/health-tracker" className="hover:text-blue-600 transition-colors">Health Tracker</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50/60 to-transparent border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3.5 py-1 rounded-full mb-4">
            📅 Pro Feature
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Appointment <span className="text-blue-600">Reminders</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Save your doctor appointments and get email reminders the day before.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Add New Appointment</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. John Smith"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Appointment Date</label>
                <input
                  type="date"
                  required
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Time (optional)</label>
              <input
                type="time"
                value={apptTime}
                onChange={(e) => setApptTime(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Notes (optional)</label>
              <input
                type="text"
                placeholder="Bring insurance card..."
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
              {submitting ? "Saving..." : "Save Appointment"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Upcoming Appointments</h2>
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">No appointments yet.</div>
          ) : (
            <div className="space-y-2">
              {appointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">👨‍⚕️ {appt.doctor_name}</p>
                    <p className="text-slate-500 mt-0.5">
                      📅 {formatDate(appt.appointment_date)} {appt.appointment_time && `at ${appt.appointment_time}`}
                    </p>
                    {appt.notes && <p className="text-slate-400 mt-0.5">{appt.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(appt.id)}
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