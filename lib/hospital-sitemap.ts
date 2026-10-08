import { supabase } from "@/lib/supabase";

export const HOSPITAL_CHUNK_SIZE = 10000;
const PAGE = 1000;

// Naam mein inme se koi lafz ho to sitemap mein nahi jayega (ghair-hospital entries)
const EXCLUDE_WORDS = [
  "supply",
  "supplies",
  "pharmacy",
  "home health",
  "home care",
  "homecare",
  "medical equipment",
  "durable medical",
  "ambulance",
  "transport",
  "hospice",
];

export type HospitalRow = {
  npi_number: string | null;
  name: string | null;
  city: string | null;
  state: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function excludeNonHospitals(query: any): any {
  let q = query;
  for (const w of EXCLUDE_WORDS) {
    q = q.not("name", "ilike", `%${w}%`);
  }
  return q;
}

export async function getHospitalChunkCount(): Promise<number> {
  const base = supabase
    .from("hospitals")
    .select("id", { count: "exact", head: true })
    .not("npi_number", "is", null);
  const { count } = await excludeNonHospitals(base);
  return Math.max(1, Math.ceil((count || 0) / HOSPITAL_CHUNK_SIZE));
}

export async function getHospitalChunkRows(chunk: number): Promise<HospitalRow[]> {
  const start = chunk * HOSPITAL_CHUNK_SIZE;
  const pages = HOSPITAL_CHUNK_SIZE / PAGE;
  const results = await Promise.all(
    Array.from({ length: pages }, (_, p) => {
      const from = start + p * PAGE;
      const base = supabase
        .from("hospitals")
        .select("npi_number, name, city, state")
        .not("npi_number", "is", null);
      return excludeNonHospitals(base)
        .order("id", { ascending: true })
        .range(from, from + PAGE - 1);
    })
  );
  const rows: HospitalRow[] = [];
  for (const r of results) {
    if (r.data) rows.push(...(r.data as HospitalRow[]));
  }
  return rows;
}