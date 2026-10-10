import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/hospital-url";
import { slugify, titleCase, stateFromSlug, stateName } from "@/lib/hub";

export const revalidate = 604800;

type CityRow = { city: string; hospital_count: number };

async function getCities(code: string) {
  const { data } = await supabase
    .from("hospital_hub_counts")
    .select("city, hospital_count")
    .eq("state", code)
    .range(0, 999);

  const merged = new Map<string, { label: string; slug: string; count: number }>();
  for (const r of (data || []) as CityRow[]) {
    const slug = slugify(r.city);
    if (!slug) continue;
    const prev = merged.get(slug);
    if (prev) prev.count += r.hospital_count;
    else merged.set(slug, { label: titleCase(r.city), slug, count: r.hospital_count });
  }
  return Array.from(merged.values()).sort((a, b) => b.count - a.count);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const code = stateFromSlug(state);
  if (!code) return { title: "Not found", robots: { index: false } };
  const name = stateName(code);
  const cities = await getCities(code);
  const total = cities.reduce((s, c) => s + c.count, 0);
  const title = `Hospitals in ${name} (${code}) | MDScout`;
  const description = `Browse ${total.toLocaleString()} hospitals in ${name} by city. Find NPI-verified hospital listings with phone numbers and directions on MDScout.`;
  const url = `${SITE_URL}/hospitals/${code.toLowerCase()}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "MDScout" },
  };
}

export default async function HospitalsStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const code = stateFromSlug(state);
  if (!code) notFound();

  const name = stateName(code);
  const cities = await getCities(code);
  if (cities.length === 0) notFound();
  const total = cities.reduce((s, c) => s + c.count, 0);
  const base = `/hospitals/${code.toLowerCase()}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Hospitals", item: `${SITE_URL}/hospitals` },
      { "@type": "ListItem", position: 3, name: name, item: `${SITE_URL}${base}` },
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
          <Link href="/hospitals" className="text-blue-600 hover:underline">Hospitals</Link>
          {" / "}
          <span className="text-gray-900">{name}</span>
        </nav>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">Hospitals in {name}</h1>
        <p className="mt-2 text-gray-700">
          {total.toLocaleString()} hospitals across {cities.length.toLocaleString()} cities in {name}.
          Choose a city to see its hospitals.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">Cities in {name}</h2>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {cities.map((c) => (
            <li key={c.slug}>
              <Link
                href={`${base}/${c.slug}`}
                prefetch={false}
                className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-blue-500 hover:text-blue-700"
              >
                <span>{c.label}</span>
                <span className="text-gray-500">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}