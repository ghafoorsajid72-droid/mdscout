import { supabase } from "@/lib/supabase";
import { slugify, titleCase } from "@/lib/hub";

export const MIN_CITY_DOCTORS = 5;
export const MIN_SPECIALTY_DOCTORS = 3;

type CityRow = { city: string; doctor_count: number };
type SpecRow = { specialty: string; doctor_count: number };

export type DoctorRow = {
  npi_number: string | null;
  first_name: string | null;
  last_name: string | null;
  specialty: string | null;
  city: string | null;
  state: string | null;
};

export async function fetchStateCityRows(code: string): Promise<CityRow[]> {
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
  return all;
}

export async function resolveDoctorCity(code: string, citySlug: string) {
  const rows = await fetchStateCityRows(code);
  const variants: string[] = [];
  let total = 0;
  const others = new Map<string, { label: string; slug: string; count: number }>();
  for (const r of rows) {
    const s = slugify(r.city);
    if (!s) continue;
    if (s === citySlug) {
      variants.push(r.city);
      total += r.doctor_count;
    } else {
      const prev = others.get(s);
      if (prev) prev.count += r.doctor_count;
      else others.set(s, { label: titleCase(r.city), slug: s, count: r.doctor_count });
    }
  }
  if (variants.length === 0 || total < MIN_CITY_DOCTORS) return null;
  const nearby = Array.from(others.values())
    .filter((c) => c.count >= MIN_CITY_DOCTORS)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  return { variants, total, label: titleCase(variants[0]), nearby };
}

export async function getCitySpecialties(code: string, variants: string[]) {
  const { data } = await supabase
    .from("doctor_hub_counts")
    .select("specialty, doctor_count")
    .eq("state", code)
    .in("city", variants)
    .range(0, 999);
  const merged = new Map<string, { label: string; slug: string; count: number }>();
  for (const r of (data || []) as SpecRow[]) {
    const s = slugify(r.specialty);
    if (!s) continue;
    const prev = merged.get(s);
    if (prev) prev.count += r.doctor_count;
    else merged.set(s, { label: titleCase(r.specialty), slug: s, count: r.doctor_count });
  }
  return Array.from(merged.values())
    .filter((x) => x.count >= MIN_SPECIALTY_DOCTORS)
    .sort((a, b) => b.count - a.count);
}

export async function getCityDoctors(
  code: string,
  variants: string[],
  limit: number
): Promise<DoctorRow[]> {
  const { data } = await supabase
    .from("doctors")
    .select("npi_number, first_name, last_name, specialty, city, state")
    .eq("state", code)
    .in("city", variants)
    .not("npi_number", "is", null)
    .order("plan_priority", { ascending: false, nullsFirst: false })
    .range(0, limit - 1);
  return (data || []) as DoctorRow[];
}

export function doctorHubName(d: DoctorRow): string {
  const n = `${d.first_name || ""} ${d.last_name || ""}`.trim();
  return n ? `Dr. ${titleCase(n)}` : "Doctor";
}

export function doctorHubPath(d: DoctorRow): string {
  const n = slugify(`${d.first_name || ""} ${d.last_name || ""}`);
  return `/doctor/${n ? `${n}-` : ""}${d.npi_number}`;
}