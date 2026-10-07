"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function saveCurrentPage() {
  try {
    const p = window.location.pathname;
    if (p.startsWith("/login") || p.startsWith("/auth")) return;
    sessionStorage.setItem("mdscout_return_to", p + window.location.search);
  } catch {}
}

export default function ReturnTracker() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    saveCurrentPage();
    document.addEventListener("click", saveCurrentPage, true);
    return () => document.removeEventListener("click", saveCurrentPage, true);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem("mdscout_after_login");
    } catch {}
    if (!raw) return;
    const [ts, target] = [raw.split("|")[0], raw.split("|").slice(1).join("|")];
    const fresh = Date.now() - Number(ts) < 10 * 60 * 1000;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      try {
        sessionStorage.removeItem("mdscout_after_login");
      } catch {}
      if (fresh && target.startsWith("/") && !target.startsWith("//") && target !== "/") {
        router.replace(target);
      }
    });
  }, [pathname, router]);

  return null;
}