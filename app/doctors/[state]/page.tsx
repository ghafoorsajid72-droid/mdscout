import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/hospital-url";
import { STATE_NAMES, slugify, titleCase, stateFromSlug, stateName } from "@/lib/hub";

export const revalidate = 604800;

const MIN_DOCTORS = 5;

type CityRow = { city: string; doctor_count: number };
type SpecRow = { specialty: string; doctor_count: number };

async function getStateData(code: string) {
  const all: CityRow[] = [];
  for (let i = 0; i < 6; i++) {
    const { data } = await supabase
      .from("doctor_hub_cities")
      .select("city, doctor_count")
      .eq("state", code)
      .order("city", { ascending: true })
      .range(i * 1000, i * 1000 + 999);
    const rows = (data || []) as CityRow[];
    all.push(...rows);
    if (rows.length < 1000) break;
  }

  let total = 0;
  const merged = new Map<string, { label: string; slug: string; count: number }>();
  for (const r of all) {
    total += r.doctor_count;
    const slug = slugify(r.city);
    if (!slug) continue;
    const prev = merged.get(slug);
    if (prev) prev.count += r.doctor_count;
    else merged.set(slug, { label: titleCase(r.city), slug, count: r.doctor_count });
  }
  const cities = Array.from(merged.values())
    .filter((c) => c.count >= MIN_DOCTORS)
    .sort((a, b) => b.count - a.count);

  const { data: specData } = await supabase
    .from("doctor_hub_specialties")
    .select("specialty, doctor_count")
    .eq("state", code)
    .order("doctor_count", { ascending: false })
    .range(0, 19);
  const specialties = ((specData || []) as SpecRow[]).map((s) => ({
    label: titleCase(s.specialty),
    count: s.doctor_count,
  }));

  return { total, cities, specialties };
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
  const { total } = await getStateData(code);
  const title = `Doctors in ${name} (${code}) | MDScout`;
  const description = `Find ${total.toLocaleString()} NPI-verified doctors in ${name}. Browse by city and specialty on MDScout.`;
  const url = `${SITE_URL}/doctors/${code.toLowerCase()}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "MDScout" },
  };
}

export default async function DoctorsStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const code = stateFromSlug(state);
  if (!code) notFound();

  const name = stateName(code);
  const { total, cities, specialties } = await getStateData(code);
  if (total === 0 || cities.length === 0) notFound();
  const base = `/doctors/${code.toLowerCase()}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Doctors", item: `${SITE_URL}/doctors` },
      { "@type": "ListItem", position: 3, name: name, item: `${SITE_URL}${base}` },
    ],
  };

  const otherStates = Object.entries(STATE_NAMES).filter(([c]) => c !== code);

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
          <Link href="/doctors" className="text-blue-600 hover:underline">Doctors</Link>
          {" / "}
          <span className="text-gray-900">{name}</span>
        </nav>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">Doctors in {name}</h1>
        <p className="mt-2 text-gray-700">
          {total.toLocaleString()} NPI-verified doctors in {name}. Choose a city to find
          doctors by specialty.
        </p>

        {specialties.length > 0 && (
          <>
            <h2 className="mt-8 text-xl font-semibold text-gray-900">
              Most common specialties in {name}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {specialties.map((s) => (
                <li
                  key={s.label}
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-900"
                >
                  {s.label} <span className="text-gray-500">({s.count.toLocaleString()})</span>
                </li>
              ))}
            </ul>
          </>
        )}

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
                <span className="text-gray-500">{c.count.toLocaleString()}</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">Doctors in other states</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {otherStates.map(([c, n]) => (
            <li key={c}>
              <Link
                href={`/doctors/${c.toLowerCase()}`}
                prefetch={false}
                className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-900 hover:border-blue-500 hover:text-blue-700"
              >
                {n}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}