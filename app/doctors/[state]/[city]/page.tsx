import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/hospital-url";
import { stateFromSlug, stateName, titleCase } from "@/lib/hub";
import {
  resolveDoctorCity,
  getCitySpecialties,
  getCityDoctors,
  doctorHubName,
  doctorHubPath,
} from "@/lib/doctor-hub";
import DoctorLink from "./DoctorLink";

export const revalidate = 604800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}): Promise<Metadata> {
  const { state, city } = await params;
  const code = stateFromSlug(state);
  if (!code) return { title: "Not found", robots: { index: false } };
  const info = await resolveDoctorCity(code, city);
  if (!info) return { title: "Not found", robots: { index: false } };
  const name = stateName(code);
  const title = `Doctors in ${info.label}, ${code} | MDScout`;
  const description = `Find ${info.total.toLocaleString()} NPI-verified doctors in ${info.label}, ${name}. Browse by specialty on MDScout.`;
  const url = `${SITE_URL}/doctors/${code.toLowerCase()}/${city}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "MDScout" },
  };
}

export default async function DoctorsCityPage({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}) {
  const { state, city } = await params;
  const code = stateFromSlug(state);
  if (!code) notFound();

  const info = await resolveDoctorCity(code, city);
  if (!info) notFound();

  const [specialties, doctors] = await Promise.all([
    getCitySpecialties(code, info.variants),
    getCityDoctors(code, info.variants, 10),
  ]);

  const name = stateName(code);
  const stateBase = `/doctors/${code.toLowerCase()}`;
  const cityBase = `${stateBase}/${city}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Doctors", item: `${SITE_URL}/doctors` },
      { "@type": "ListItem", position: 3, name: name, item: `${SITE_URL}${stateBase}` },
      { "@type": "ListItem", position: 4, name: info.label, item: `${SITE_URL}${cityBase}` },
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
          <span className="text-gray-900">{info.label}</span>
        </nav>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Doctors in {info.label}, {code}
        </h1>
        <p className="mt-2 text-gray-700">
          {info.total.toLocaleString()} NPI-verified doctors in {info.label}, {name}. Choose a
          specialty to see doctors.
        </p>

        {specialties.length > 0 && (
          <>
            <h2 className="mt-8 text-xl font-semibold text-gray-900">
              Specialties in {info.label}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {specialties.slice(0, 60).map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`${cityBase}/${s.slug}`}
                    prefetch={false}
                    className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-blue-500 hover:text-blue-700"
                  >
                    <span>{s.label}</span>
                    <span className="text-gray-500">{s.count.toLocaleString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {doctors.length > 0 && (
          <>
            <h2 className="mt-10 text-xl font-semibold text-gray-900">
              Doctors in {info.label}
            </h2>
            <ul className="mt-4 space-y-3">
              {doctors.map((d) => (
                <li
                  key={d.npi_number}
                  className="rounded-xl border border-gray-300 bg-white p-4"
                >
                  <DoctorLink
                    href={doctorHubPath(d)}
                    className="text-lg font-semibold text-blue-600 hover:underline"
                  >
                    {doctorHubName(d)}
                  </DoctorLink>
                  <p className="mt-1 text-sm text-gray-700">
                    {d.specialty ? titleCase(d.specialty) : "Doctor"} • {info.label}, {code}
                  </p>
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