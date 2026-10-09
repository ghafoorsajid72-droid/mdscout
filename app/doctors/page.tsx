import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/hospital-url";
import { STATE_NAMES } from "@/lib/hub";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Find Doctors by State | MDScout" },
  description:
    "Browse 800,000+ NPI-verified US doctors by state, city and specialty on MDScout.",
  alternates: { canonical: `${SITE_URL}/doctors` },
  openGraph: {
    title: "Find Doctors by State | MDScout",
    description:
      "Browse 800,000+ NPI-verified US doctors by state, city and specialty on MDScout.",
    url: `${SITE_URL}/doctors`,
    type: "website",
    siteName: "MDScout",
  },
};

export default function DoctorsIndexPage() {
  const states = Object.entries(STATE_NAMES);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Doctors", item: `${SITE_URL}/doctors` },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />

        <nav className="text-sm text-gray-600">
          <Link href="/" className="text-blue-600 hover:underline">Home</Link>
          {" / "}
          <span className="text-gray-900">Doctors</span>
        </nav>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">Find Doctors by State</h1>
        <p className="mt-2 text-gray-700">
          Browse NPI-verified doctors across the United States. Choose a state, then a city and
          specialty.
        </p>

        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Search doctors by name, specialty or city
        </Link>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">All states</h2>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {states.map(([code, name]) => (
            <li key={code}>
              <Link
                href={`/doctors/${code.toLowerCase()}`}
                prefetch={false}
                className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-blue-500 hover:text-blue-700"
              >
                <span>Doctors in {name}</span>
                <span className="text-gray-500">{code}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}