import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  SITE_URL,
  doctorName,
  doctorSlug,
  npiFromSlug,
  formatPhone,
  titleCase,
} from "@/lib/doctor-url";

export const revalidate = 86400;

type Doctor = {
  id: string;
  npi_number: string;
  first_name: string | null;
  last_name: string | null;
  specialty: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  bio: string | null;
  working_hours: string | null;
  insurance_accepted: string | null;
  photo_url: string | null;
};

async function getDoctor(slug: string): Promise<Doctor | null> {
  const npi = npiFromSlug(slug);
  if (!npi) return null;
  const { data } = await supabase
    .from("doctors")
    .select(
      "id, npi_number, first_name, last_name, specialty, state, city, address, phone, bio, working_hours, insurance_accepted, photo_url"
    )
    .eq("npi_number", npi)
    .limit(1);
  return data && data[0] ? (data[0] as Doctor) : null;
}

function place(d: Doctor): string {
  const city = titleCase(d.city);
  const state = (d.state ?? "").toUpperCase();
  return [city, state].filter(Boolean).join(", ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDoctor(slug);
  if (!d) {
    return { title: "Doctor not found | MDScout", robots: { index: false } };
  }
  const name = doctorName(d);
  const specialty = titleCase(d.specialty) || "Doctor";
  const loc = place(d);
  const title = `${name}, ${specialty}${loc ? ` in ${loc}` : ""} | MDScout`;
  const description = `${name} is a ${specialty}${
    loc ? ` in ${loc}` : ""
  }. View address, phone number and NPI ${d.npi_number} on MDScout.`;
  const canonical = `${SITE_URL}/doctor/${doctorSlug(d)}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "profile" },
  };
}

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = await getDoctor(slug);
  if (!d) notFound();

  const name = doctorName(d);
  const specialty = titleCase(d.specialty) || "Doctor";
  const loc = place(d);
  const phone = formatPhone(d.phone);
  const url = `${SITE_URL}/doctor/${doctorSlug(d)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name,
    medicalSpecialty: specialty,
    url,
    telephone: d.phone ?? undefined,
    identifier: d.npi_number,
    address: {
      "@type": "PostalAddress",
      streetAddress: d.address ?? undefined,
      addressLocality: titleCase(d.city) || undefined,
      addressRegion: d.state ?? undefined,
      addressCountry: "US",
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <Link href="/" className="text-sm text-blue-600 hover:underline">
      ← Back to search
      </Link>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
        <p className="mt-1 text-lg text-blue-700">{specialty}</p>
        {loc && <p className="mt-1 text-gray-600">{loc}</p>}

        <dl className="mt-6 space-y-4 text-gray-800">
          {d.address && (
            <div>
              <dt className="text-sm font-semibold text-gray-500">Address</dt>
              <dd>
                {d.address}
                {loc ? `, ${loc}` : ""}
              </dd>
            </div>
          )}
          {phone && (
            <div>
              <dt className="text-sm font-semibold text-gray-500">Phone</dt>
              <dd>
                <a
                  href={`tel:${(d.phone ?? "").replace(/\D/g, "")}`}
                  className="text-blue-600 hover:underline"
                >
                  {phone}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-semibold text-gray-500">NPI number</dt>
            <dd>{d.npi_number}</dd>
          </div>
          {d.working_hours && (
            <div>
              <dt className="text-sm font-semibold text-gray-500">
                Working hours
              </dt>
              <dd>{d.working_hours}</dd>
            </div>
          )}
          {d.insurance_accepted && (
            <div>
              <dt className="text-sm font-semibold text-gray-500">
                Insurance accepted
              </dt>
              <dd>{d.insurance_accepted}</dd>
            </div>
          )}
          {d.bio && (
            <div>
              <dt className="text-sm font-semibold text-gray-500">About</dt>
              <dd>{d.bio}</dd>
            </div>
          )}
        </dl>
      </div>
    </main>
  );
}