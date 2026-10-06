"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ContactForm({
  doctorId,
  doctorName,
}: {
  doctorId: string;
  doctorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("General Query");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setEmail(u.email ?? "");
        setName((u.user_metadata?.full_name as string) ?? "");
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const { error } = await supabase.from("inquiries").insert({
      doctor_id: String(doctorId),
      doctor_name: doctorName,
      sender_name: name || "Patient / Visitor",
      sender_email: email,
      inquiry_type: type,
      message,
    });

    if (error) {
      setError("Error sending inquiry: " + error.message);
    } else {
      setSuccess("Your inquiry has been sent successfully!");
      setMessage("");
    }
    setSubmitting(false);
  }

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Contact {doctorName}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          {open ? "Close" : "Send Direct Inquiry"}
        </button>
      </div>

      {open && (
        <div className="mt-4">
          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-700">
              {success}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border p-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border p-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Inquiry Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border bg-white p-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General Query">General Query</option>
                  <option value="Appointment Request">Appointment Request</option>
                  <option value="Second Opinion">Second Opinion</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Message
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your medical query or preferred appointment time..."
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
                {submitting ? "Sending Inquiry..." : "Submit Inquiry"}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}