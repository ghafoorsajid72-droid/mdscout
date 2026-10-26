import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI Symptom Checker | MDScout",
  robots: { index: false, follow: true },
};

export default function SymptomCheckerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}