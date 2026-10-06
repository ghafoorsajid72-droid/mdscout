"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string | number;
  rating: number;
  review_text: string | null;
};

export default function Reviews({ npi }: { npi: string }) {
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadReviews() {
    const { data, error } = await supabase
      .from("doctor_reviews")
      .select("*")
      .eq("doctor_npi", npi)
      .order("created_at", { ascending: false });
    if (!error && data) setReviews(data as Review[]);
    setLoading(false);
  }

  useEffect(() => {
    loadReviews();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npi]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || rating === 0) return;
    setSubmitting(true);
    setMessage("");
    const { error } = await supabase.from("doctor_reviews").upsert(
      {
        doctor_npi: npi,
        user_id: user.id,
        rating,
        review_text: text || null,
      },
      { onConflict: "doctor_npi,user_id" }
    );
    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Thank you! Your review has been posted.");
      setText("");
      await loadReviews();
    }
    setSubmitting(false);
  }

  const average =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Patient Reviews</h2>
        {average && (
          <span className="text-sm font-bold text-amber-600">
            ⭐ {average} ({reviews.length})
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="mb-4 text-sm text-gray-500">
          No reviews yet. Be the first to review!
        </p>
      ) : (
        <div className="mb-4 max-h-60 space-y-2 overflow-y-auto">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div className="mb-1 text-sm text-amber-500">
                {"⭐".repeat(r.rating)}
              </div>
              {r.review_text && (
                <p className="text-sm text-gray-700">{r.review_text}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className={`p-1 text-2xl leading-none transition-transform hover:scale-125 ${
                  star <= rating
                    ? "text-amber-500"
                    : "text-gray-300 hover:text-amber-300"
                }`}
              >
                ⭐
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            placeholder="Share your experience (optional)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border p-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {message && (
            <p className="text-sm font-semibold text-emerald-600">{message}</p>
          )}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full rounded-lg bg-gray-800 py-2 text-sm font-bold text-white transition hover:bg-gray-900 disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Review"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500">
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      )}
    </section>
  );
}