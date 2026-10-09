import { supabase } from "@/lib/supabase";
import { STATE_NAMES, slugify } from "@/lib/hub";

export const HUB_CHUNK = 10000;
const PAGE = 1000;

export async function getSpecialtyChunkCount(): Promise<number> {
  const { count } = await supabase
    .from("doctor_hub_sitemap_urls")
    .select("id", { count: "exact", head: true });
  return Math.max(1, Math.ceil((count || 0) / HUB_CHUNK));
}

function validState(s: string | null | undefined): string | null {
  const code = (s || "").toUpperCase();
  return STATE_NAMES[code] ? code.toLowerCase() : null;
}

export async function getHospitalHubPaths(): Promise<string[]> {
  const rows: { state: string; city: string; hospital_count: number }[] = [];
  for (let i = 0; i < 20; i++) {
    const { data } = await supabase
      .from("hospital_hub_counts")
      .select("state, city, hospital_count")
      .order("state", { ascending: true })
      .order("city", { ascending: true })
      .range(i * PAGE, i * PAGE + PAGE - 1);
    const batch = (data || []) as { state: string; city: string; hospital_count: number }[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  const out = new Set<string>();
  for (const r of rows) {
    const st = validState(r.state);
    if (!st) continue;
    out.add(`/hospitals/${st}`);
    const cs = slugify(r.city);
    if (cs && r.hospital_count >= 3) out.add(`/hospitals/${st}/${cs}`);
  }
  return Array.from(out);
}

export async function getDoctorCityPaths(): Promise<string[]> {
  const rows: { state: string; city: string }[] = [];
  for (let i = 0; i < 30; i++) {
    const { data } = await supabase
      .from("doctor_hub_cities")
      .select("state, city")
      .gte("doctor_count", 5)
      .order("state", { ascending: true })
      .order("city", { ascending: true })
      .range(i * PAGE, i * PAGE + PAGE - 1);
    const batch = (data || []) as { state: string; city: string }[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  const out = new Set<string>();
  for (const r of rows) {
    const st = validState(r.state);
    if (!st) continue;
    out.add(`/doctors/${st}`);
    const cs = slugify(r.city);
    if (cs) out.add(`/doctors/${st}/${cs}`);
  }
  return Array.from(out);
}

export async function getSpecialtyPaths(chunk: number): Promise<string[]> {
  const start = chunk * HUB_CHUNK + 1;
  const results = await Promise.all(
    Array.from({ length: HUB_CHUNK / PAGE }, (_, p) => {
      const lo = start + p * PAGE;
      return supabase
        .from("doctor_hub_sitemap_urls")
        .select("state, city, specialty")
        .gte("id", lo)
        .lte("id", lo + PAGE - 1)
        .order("id", { ascending: true });
    })
  );
  const out = new Set<string>();
  for (const r of results) {
    for (const row of (r.data || []) as { state: string; city: string; specialty: string }[]) {
      const st = validState(row.state);
      const cs = slugify(row.city);
      const ss = slugify(row.specialty);
      if (st && cs && ss) out.add(`/doctors/${st}/${cs}/${ss}`);
    }
  }
  return Array.from(out);
}

export async function getHubPaths(id: number): Promise<string[]> {
  if (id === 0) return getHospitalHubPaths();
  if (id === 1) return getDoctorCityPaths();
  return getSpecialtyPaths(id - 2);
}