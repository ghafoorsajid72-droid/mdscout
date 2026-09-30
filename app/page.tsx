import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Find Doctors & Hospitals Near You | MDScout",
  description:
    "Search 800,000+ NPI-verified US doctors and 70,000+ hospitals by name, specialty, city, insurance, or distance. Free, updated daily.",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MDScout",
  url: "https://getmdscout.com",
  description:
    "Nationwide directory of NPI-verified US doctors and hospitals.",
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}