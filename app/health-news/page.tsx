"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

export default function HealthNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetch("/api/health-news");
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
        } else {
          setError("Could not load health news right now.");
        }
      } catch (err) {
        setError("Could not load health news right now.");
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, []);

  function formatDate(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
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
            <Link href="/health-news" className="text-blue-600 font-semibold">Health News</Link>
            <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50/60 to-transparent border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3.5 py-1 rounded-full mb-4">
            📰 Trusted Health Updates
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Daily Health <span className="text-blue-600">News & Updates</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500 max-w-xl">
            Curated from MedlinePlus, a trusted service of the U.S. National Library of Medicine (NIH).
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-medium">
            Loading latest health updates...
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
             <a 
                key={idx}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                        {item.description.replace(/<[^>]*>/g, "").trim()}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-2">
                      {formatDate(item.pubDate)}
                    </p>
                  </div>
                  <span className="text-blue-600 text-xs font-semibold whitespace-nowrap">
                    Read →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-[11px] text-slate-400">
          Content sourced from{" "}
          <a href="https://medlineplus.gov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            MedlinePlus
          </a>
          , a service of the U.S. National Library of Medicine.
        </div>
      </footer>
    </div>
  );
}