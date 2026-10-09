"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export default function HospitalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      onClick={() => {
        try {
          sessionStorage.setItem(
            "mdscout_last_hospitals",
            window.location.pathname + window.location.search
          );
        } catch {}
      }}
    >
      {children}
    </Link>
  );
}