"use client";
import { useState } from "react";
import Link from "next/link";

const SPECIALTY_ICONS: Record<string, string> = {
  "Primary Care": "👤",
  Cardiology: "❤️",
  Dermatology: "🧴",
  Pediatrics: "👶",
  Neurology: "🧠",
  Dentistry: "🦷",
  Orthopedics: "🦴",
};

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    specialties: string[];
    urgency: "routine" | "soon" | "emergency";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (symptoms.trim().length < 3) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Could not connect. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const urgencyStyles: Record<string, string> = {
    emergency: "bg-red-50 border-red-300 text-red-800",
    soon: "bg-amber-50 border-amber-300 text-amber-800",
    routine: "bg-emerald-50 border-emerald-300 text-emerald-800",
  };

  const urgencyLabels: Record<string, string> = {
    emergency: "🚨 Seek Emergency Care Now",
    soon: "⚠️ See a Doctor Soon",
    routine: "✅ Routine Checkup Recommended",
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              🛡️
            </div>
            <span className="text-xl font-extrabold text-blue-900 tracking-tight">
              MDScout<span className="text-blue-600">.io</span>
            </span>
          </Link>
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
            ← Back to Directory
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3.5 py-1 rounded-full mb-4">
            🩺 AI Symptom Checker
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Not Sure Which Doctor to See?
          </h1>
          <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">
            Describe how you're feeling in your own words, and we'll suggest which type of specialist you should book an appointment with.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              rows={4}
              placeholder="Example: I've had a sore throat and mild fever for 2 days, and my ears feel blocked..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              maxLength={1000}
              className="w-full p-3.5 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{symptoms.length}/1000</span>
              <button
                type="submit"
                disabled={loading || symptoms.trim().length < 3}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? "Analyzing..." : "Check Symptoms"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className={`p-4 rounded-xl border text-sm font-bold ${urgencyStyles[result.urgency]}`}>
                {urgencyLabels[result.urgency]}
              </div>

              {result.message && (
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {result.message}
                </p>
              )}

              {result.urgency === "emergency" ? (
                <div className="text-center p-4 bg-red-600 text-white rounded-xl font-bold text-sm">
                  Call 911 or go to your nearest Emergency Room immediately.
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Recommended Specialists
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.specialties.map((spec) => (
                      <Link
                        key={spec}
                        href={`/?specialty=${encodeURIComponent(spec)}`}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                      >
                        <span>{SPECIALTY_ICONS[spec] || "🩺"}</span>
                        Find {spec} Doctors →
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400 max-w-xl mx-auto">
          ⚕️ This tool provides general guidance only and is not a medical diagnosis. It does not replace professional medical advice. Always consult a licensed healthcare provider for any health concerns. In an emergency, call your local emergency number immediately.
        </p>
      </main>
    </div>
  );
}