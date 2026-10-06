"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ClaimProfile({
  doctorId,
  doctorName,
  npi,
}: {
  doctorId: string;
  doctorName: string;
  npi: string;
}) {
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [npiInput, setNpiInput] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    const { error } = await supabase.from("claim_requests").insert({
      doctor_id: doctorId,
      user_id: user.id,
      npi_entered: npiInput,
      message,
    });

    if (error) {
      setError("Error submitting claim: " + error.message);
    } else {
      setSuccess(
        "Your claim request has been submitted! We'll review it and get back to you."
      );
      setNpiInput("");
      setMessage("");
    }
    setSubmitting(false);
  }

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Is this you? Claim this profile
          </h2>
          <p className="text-sm text-gray-500">
            Are you {doctorName}? Request ownership of this listing.
          </p>
        </div>
        {user ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            {open ? "Close" : "👨‍⚕️ Claim Profile"}
          </button>
        ) : (
          <Link
            href="/login"
            className="shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-blue-600 transition hover:bg-gray-50"
          >
            Sign in to claim
          </Link>
        )}
      </div>

      {user && open && (
        <div className="mt-4">
          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-700">
              {success}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Confirm NPI Number ({npi})
                </label>
                <input
                  type="text"
                  required
                  placeholder="Re-enter the NPI number shown above"
                  value={npiInput}
                  onChange={(e) => setNpiInput(e.target.value)}
                  className="w-full rounded-lg border p-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Additional Information (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Let us know anything that helps verify this is your profile..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border p-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && (
                <p className="text-sm font-semibold text-red-600">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Claim Request"}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}