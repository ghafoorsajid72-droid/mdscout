import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/hospital-url";
import { slugify, titleCase, stateFromSlug, stateName } from "@/lib/hub";
import {
  MIN_SPECIALTY_DOCTORS,
  resolveDoctorCity,
  getCitySpecialties,
  doctorHubName,
  doctorHubPath,
} from "@/lib/doctor-hub";
import DoctorLink from "../DoctorLink";

export const revalidate = 604800;

const PAGE_SIZE = 20;

type SpecRow = { specialty: string; doctor_count: number };
type Row = {
  npi_number: string | null;
  first_name: string | null;
  last_name: string | null;
  specialty: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
};

async function resolveSpecialty(code: string, cityVariants: string[], specSlug: string) {
  const { data } = await supabase
    .from("doctor_hub_counts")
    .select("specialty, doctor_count")
    .eq("state", code)
    .in("city", cityVariants)
    .range(0, 999);
  const variants: string[] = [];
  let total = 0;
  for (const r of (data || []) as SpecRow[]) {
    if (slugify(r.specialty) === specSlug) {
      if (!variants.includes(r.specialty)) variants.push(r.specialty);
      total += r.doctor_count;
    }
  }
  if (variants.length === 0 || total < MIN_SPECIALTY_DOCTORS) return null;
  return { variants, total, label: titleCase(variants[0]) };
}

async function getDoctors(
  code: string,
  cityVariants: string[],
  specVariants: string[],
  page: number
) {
  const from = (page - 1) * PAGE_SIZE;
  const { data } = await supabase
    .from("doctors")
    .select("npi_number, first_name, last_name, specialty, city, state, address")
    .eq("state", code)
    .in("city", cityVariants)
    .in("specialty", specVariants)
    .not("npi_number", "is", null)
    .order("plan_priority", { ascending: false, nullsFirst: false })
    .order("npi_number", { ascending: true })
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
  params: Promise<{ state: string; city: string; specialty: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { state, city, specialty } = await params;
  const sp = await searchParams;
  const code = stateFromSlug(state);
  if (!code) return { title: "Not found", robots: { index: false } };
  const info = await resolveDoctorCity(code, city);
  if (!info) return { title: "Not found", robots: { index: false } };
  const spec = await resolveSpecialty(code, info.variants, specialty);
  if (!spec) return { title: "Not found", robots: { index: false } };
  const page = pageNumber(sp.page);
  const name = stateName(code);
  const suffix = page > 1 ? ` - Page ${page}` : "";
  const title = `${spec.label} in ${info.label}, ${code}${suffix} | MDScout`;
  const description = `Find ${spec.total.toLocaleString()} NPI-verified ${spec.label} doctors in ${info.label}, ${name}. View addresses and profiles on MDScout.`;
  const path = `/doctors/${code.toLowerCase()}/${city}/${specialty}`;
  const url = `${SITE_URL}${path}${page > 1 ? `?page=${page}` : ""}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "MDScout" },
  };
}

export default async function DoctorsSpecialtyPage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string; city: string; specialty: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { state, city, specialty } = await params;
  const sp = await searchParams;
  const code = stateFromSlug(state);
  if (!code) notFound();

  const info = await resolveDoctorCity(code, city);
  if (!info) notFound();

  const spec = await resolveSpecialty(code, info.variants, specialty);
  if (!spec) notFound();

  const totalPages = Math.max(1, Math.ceil(spec.total / PAGE_SIZE));
  const page = Math.min(pageNumber(sp.page), totalPages);

  const [doctors, citySpecs] = await Promise.all([
    getDoctors(code, info.variants, spec.variants, page),
    getCitySpecialties(code, info.variants),
  ]);
  const otherSpecs = citySpecs.filter((s) => s.slug !== specialty).slice(0, 12);

  const name = stateName(code);
  const stateBase = `/doctors/${code.toLowerCase()}`;
  const cityBase = `${stateBase}/${city}`;
  const specBase = `${cityBase}/${specialty}`;
  const pageHref = (p: number) => (p === 1 ? specBase : `${specBase}?page=${p}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Doctors", item: `${SITE_URL}/doctors` },
      { "@type": "ListItem", position: 3, name: name, item: `${SITE_URL}${stateBase}` },
      { "@type": "ListItem", position: 4, name: info.label, item: `${SITE_URL}${cityBase}` },
      { "@type": "ListItem", position: 5, name: spec.label, item: `${SITE_URL}${specBase}` },
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
          <Link href="/doctors" className="text-blue-600 hover:underline">Doctors</Link>
          {" / "}
          <Link href={stateBase} className="text-blue-600 hover:underline">{name}</Link>
          {" / "}
          <Link href={cityBase} className="text-blue-600 hover:underline">{info.label}</Link>
          {" / "}
          <span className="text-gray-900">{spec.label}</span>
        </nav>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {spec.label} in {info.label}, {code}
        </h1>
        <p className="mt-2 text-gray-700">
          {spec.total.toLocaleString()} NPI-verified {spec.label} doctors in {info.label},{" "}
          {name}.{totalPages > 1 ? ` Page ${page} of ${totalPages}.` : ""}
        </p>

        <ul className="mt-6 space-y-3">
          {doctors.map((d) => (
            <li key={d.npi_number} className="rounded-xl border border-gray-300 bg-white p-4">
              <DoctorLink
                href={doctorHubPath(d)}
                className="text-lg font-semibold text-blue-600 hover:underline"
              >
                {doctorHubName(d)}
              </DoctorLink>
              <p className="mt-1 text-sm text-gray-700">
                {spec.label} • {info.label}, {code}
              </p>
              {d.address && (
                <p className="mt-1 text-sm text-gray-600">{titleCase(d.address)}</p>
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

        {otherSpecs.length > 0 && (
          <>
            <h2 className="mt-10 text-xl font-semibold text-gray-900">
              Other specialties in {info.label}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {otherSpecs.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`${cityBase}/${s.slug}`}
                    prefetch={false}
                    className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-900 hover:border-blue-500 hover:text-blue-700"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {info.nearby.length > 0 && (
          <>
            <h2 className="mt-10 text-xl font-semibold text-gray-900">
              Doctors in other cities in {name}
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