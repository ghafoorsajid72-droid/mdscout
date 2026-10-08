import { supabase } from "@/lib/supabase";

export const HOSPITAL_CHUNK_SIZE = 10000;
const PAGE = 1000;

export type HospitalRow = {
  npi_number: string | null;
  name: string | null;
  city: string | null;
  state: string | null;
};

export async function getHospitalChunkCount(): Promise<number> {
  const { count } = await supabase
    .from("hospitals")
    .select("id", { count: "exact", head: true });
  return Math.max(1, Math.ceil((count || 0) / HOSPITAL_CHUNK_SIZE));
}

export async function getHospitalChunkRows(chunk: number): Promise<HospitalRow[]> {
  const start = chunk * HOSPITAL_CHUNK_SIZE;
  const pages = HOSPITAL_CHUNK_SIZE / PAGE;
  const results = await Promise.all(
    Array.from({ length: pages }, (_, p) => {
      const from = start + p * PAGE;
      return supabase
        .from("hospitals")
        .select("npi_number, name, city, state")
        .not("npi_number", "is", null)
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