"use client";

import { useRouter } from "next/navigation";

export default function BackLink() {
  const router = useRouter();

  function goBack() {
    let target = "/hospitals";
    try {
      const saved = sessionStorage.getItem("mdscout_last_hospitals");
      if (saved && saved.startsWith("/")) target = saved;
    } catch {}
    router.push(target);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
    >
      ← Back to hospitals
    </button>
  );
}