"use client";

import { useRouter } from "next/navigation";

export default function BackLink() {
  const router = useRouter();

  const goBack = () => {
    let target = "/";
    try {
      const saved = sessionStorage.getItem("mdscout_last_search");
      if (saved && saved.startsWith("/")) target = saved;
    } catch {}
    router.push(target);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#2563eb", fontSize: "14px" }}
    >
      ← Back to search
    </button>
  );
}