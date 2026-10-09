import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  SITE_URL,
  hospitalTitle,
  hospitalCity,
  hospitalPath,
  hospitalPhone,
} from "@/lib/hospital-url";
import { EXCLUDE_WORDS } from "@/lib/hospital-sitemap";
import { slugify, titleCase, stateFromSlug, stateName } from "@/lib/hub";
import HospitalLink from "./HospitalLink";

export const revalidate = 86400;

const PAGE_SIZE = 50;

type CityRow = { city: string; hospital_count: number };
type Row = {
  npi_number: string | null;
  name: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  address: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function excludeNonHospitals(query: any): any {
  let q = query;
  for (const w of EXCLUDE_WORDS) {
    q = q.not("name", "ilike", `%${w}%`);
  }
  return q;
}

async function getStateCities(code: string) {
  const { data } = await supabase
    .from("hospital_hub_counts")
    .select("city, hospital_count")
    .eq("state", code)
    .range(0, 999);
  return (data || []) as CityRow[];
}

async function resolveCity(code: string, citySlug: string) {
  const rows = await getStateCities(code);
  const variants: string[] = [];
  let total = 0;
  const others = new Map<string, { label: string; slug: string; count: number }>();
  for (const r of rows) {
    const s = slugify(r.city);
    if (!s) continue;
    if (s === citySlug) {
      variants.push(r.city);
      total += r.hospital_count;
    } else {
      const prev = others.get(s);
      if (prev) prev.count += r.hospital_count;
      else others.set(s, { label: titleCase(r.city), slug: s, count: r.hospital_count });
    }
  }
  if (variants.length === 0) return null;
  const nearby = Array.from(others.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  return { variants, total, label: titleCase(variants[0]), nearby };
}

async function getHospitals(code: string, variants: string[], page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const base = supabase
    .from("hospitals")
    .select("npi_number, name, city, state, phone, address")
    .eq("state", code)
    .in("city", variants)
    .not("npi_number", "is", null)
    .not("name", "is", null);
  const { data } = await excludeNonHospitals(base)
    .order("name", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  return (data || []) as Row[];
}

function pageNumber(raw: string | undefined) {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ state: string; city: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { state, city } = await params;
  const sp = await searchParams;
  const code = stateFromSlug(state);
  if (!code) return { title: "Not found", robots: { index: false } };
  const info = await resolveCity(code, city);
  if (!info) return { title: "Not found", robots: { index: false } };
  const page = pageNumber(sp.page);
  const name = stateName(code);
  const suffix = page > 1 ? ` - Page ${page}` : "";
  const title = `Hospitals in ${info.label}, ${code}${suffix} | MDScout`;
  const description = `Find ${info.total.toLocaleString()} hospitals in ${info.label}, ${name}. NPI-verified hospital listings with phone numbers and directions on MDScout.`;
  const path = `/hospitals/${code.toLowerCase()}/${city}`;
  const url = `${SITE_URL}${path}${page > 1 ? `?page=${page}` : ""}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "MDScout" },
  };
}

export default async function HospitalsCityPage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string; city: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { state, city } = await params;
  const sp = await searchParams;
  const code = stateFromSlug(state);
  if (!code) notFound();

  const info = await resolveCity(code, city);
  if (!info) notFound();

  const totalPages = Math.max(1, Math.ceil(info.total / PAGE_SIZE));
  const page = Math.min(pageNumber(sp.page), totalPages);
  const hospitals = await getHospitals(code, info.variants, page);

  const name = stateName(code);
  const stateBase = `/hospitals/${code.toLowerCase()}`;
  const cityBase = `${stateBase}/${city}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Hospitals", item: `${SITE_URL}/hospitals` },
      { "@type": "ListItem", position: 3, name: name, item: `${SITE_URL}${stateBase}` },
      { "@type": "ListItem", position: 4, name: info.label, item: `${SITE_URL}${cityBase}` },
    ],
  };

  const pageHref = (p: number) => (p === 1 ? cityBase : `${cityBase}?page=${p}`);

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
          <Link href={stateBase} className="text-blue-600 hover:underline">{name}</Link>
          {" / "}
          <span className="text-gray-900">{info.label}</span>
        </nav>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Hospitals in {info.label}, {code}
        </h1>
        <p className="mt-2 text-gray-700">
          {info.total.toLocaleString()} hospitals in {info.label}, {name}.
          {totalPages > 1 ? ` Page ${page} of ${totalPages}.` : ""}
        </p>

        <ul className="mt-6 space-y-3">
          {hospitals.map((h) => (
            <li
              key={h.npi_number}
              className="rounded-xl border border-gray-300 bg-white p-4"
            >
              <HospitalLink
                href={hospitalPath(h)}
                className="text-lg font-semibold text-blue-600 hover:underline"
              >
                {hospitalTitle(h.name)}
              </HospitalLink>
              <p className="mt-1 text-sm text-gray-700">
                {[h.address, hospitalCity(h.city), h.state].filter(Boolean).join(", ")}
              </p>
              {hospitalPhone(h.phone) && (
                <p className="mt-1 text-sm text-gray-700">{hospitalPhone(h.phone)}</p>
              )}
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between text-sm font-semibold">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="text-blue-600 hover:underline">
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="text-blue-600 hover:underline">
                Next →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}

        {info.nearby.length > 0 && (
          <>
            <h2 className="mt-10 text-xl font-semibold text-gray-900">
              Other cities in {name}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {info.nearby.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`${stateBase}/${c.slug}`}
                    prefetch={false}
                    className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-900 hover:border-blue-500 hover:text-blue-700"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}