import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Health Tracker | MDScout",
  robots: { index: false, follow: true },
};

export default function HealthTrackerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}