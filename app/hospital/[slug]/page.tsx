import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackLink from "./BackLink";
import { isNonHospitalName } from "@/lib/hospital-sitemap";
import {
  SITE_URL,
  hospitalTitle,
  hospitalCity,
  hospitalPath,
  hospitalPhone,
  npiFromHospitalSlug,
} from "@/lib/hospital-url";

export const revalidate = 86400;

type Hospital = {
  id: number;
  npi_number: string;
  name: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  facility_type: string | null;
  latitude: number | null;
  longitude: number | null;
};

async function getHospital(slug: string): Promise<Hospital | null> {
  const npi = npiFromHospitalSlug(slug);
  if (!npi) return null;
  const { data } = await supabase
    .from("hospitals")
    .select("id, npi_number, name, city, state, address, phone, facility_type, latitude, longitude")
    .eq("npi_number", npi)
    .limit(1);
  return data && data.length > 0 ? (data[0] as Hospital) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const h = await getHospital(slug);
  if (!h) return { title: "Hospital not found", robots: { index: false } };
  const name = hospitalTitle(h.name);
  const loc = [hospitalCity(h.city), h.state].filter(Boolean).join(", ");
  const title = `${name}${loc ? ` in ${loc}` : ""} | MDScout`;
  const description = `${name}${loc ? ` in ${loc}` : ""}. View phone number, location and directions. NPI-verified hospital listing on MDScout.`;
  const url = `${SITE_URL}${hospitalPath(h)}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "MDScout" },
    robots: isNonHospitalName(h.name) ? { index: false, follow: true } : undefined,
  };
}

export default async function HospitalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const h = await getHospital(slug);
  if (!h) notFound();

  const name = hospitalTitle(h.name);
  const city = hospitalCity(h.city);
  const loc = [city, h.state].filter(Boolean).join(", ");
  const phone = hospitalPhone(h.phone);
  const hasCoords =
    typeof h.latitude === "number" &&
    typeof h.longitude === "number" &&
    !(h.latitude === 0 && h.longitude === 0);
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${loc}`)}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Hospital",
    name,
    url: `${SITE_URL}${hospitalPath(h)}`,
    identifier: { "@type": "PropertyValue", propertyID: "NPI", value: h.npi_number },
    address: {
      "@type": "PostalAddress",
      ...(h.address ? { streetAddress: h.address } : {}),
      ...(city ? { addressLocality: city } : {}),
      ...(h.state ? { addressRegion: h.state } : {}),
      addressCountry: "US",
    },
  };
  if (phone) jsonLd.telephone = phone;
  if (hasCoords) {
    jsonLd.geo = { "@type": "GeoCoordinates", latitude: h.latitude, longitude: h.longitude };
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <BackLink />

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
        {h.facility_type && <p className="mt-1 text-lg text-blue-700">{h.facility_type}</p>}
        {loc && <p className="mt-1 text-gray-600">{loc}</p>}

        <dl className="mt-6 space-y-4 text-sm">
          {h.address && (
            <div>
              <dt className="font-semibold text-gray-500">Address</dt>
              <dd className="text-gray-900">
                {h.address}
                {loc ? `, ${loc}` : ""}
              </dd>
            </div>
          )}
          {phone && (
            <div>
              <dt className="font-semibold text-gray-500">Phone</dt>
              <dd>
                <a
                  href={`tel:${(h.phone || "").replace(/\D/g, "")}`}
                  className="text-blue-600 hover:underline"
                >
                  {phone}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="font-semibold text-gray-500">NPI number</dt>
            <dd className="text-gray-900">{h.npi_number}</dd>
          </div>
        </dl>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Get Directions
        </a>
      </div>
    </main>
  );
}