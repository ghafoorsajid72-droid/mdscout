import { supabase } from "@/lib/supabase";

export const CHUNK_SIZE = 10000;
const PAGE = 1000;

export async function getChunkCount(): Promise<number> {
  const { count } = await supabase
    .from("doctors")
    .select("id", { count: "estimated", head: true });
  return Math.ceil((count ?? 0) / CHUNK_SIZE) + 1;
}

export async function getChunkRows(chunk: number) {
  const start = chunk * CHUNK_SIZE;
  const pages = Array.from({ length: CHUNK_SIZE / PAGE }, (_, i) => i);
  const results = await Promise.all(
    pages.map(async (i) => {
      const from = start + i * PAGE;
      const { data } = await supabase
        .from("doctors")
        .select("npi_number, first_name, last_name")
        .not("npi_number", "is", null)
        .order("npi_number", { ascending: true })
        .range(from, from + PAGE - 1);
      return data ?? [];
    })
  );
  return results.flat();
}