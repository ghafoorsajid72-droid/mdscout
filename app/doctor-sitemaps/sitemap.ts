import type { MetadataRoute } from "next";
import { SITE_URL, doctorPath } from "@/lib/doctor-url";
import { getChunkCount, getChunkRows } from "@/lib/doctor-sitemap";

// Build ke waqt nahi, jab Google maange tab banao (build 60s timeout se bachne ke liye)
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateSitemaps() {
  const n = await getChunkCount();
  return Array.from({ length: n }, (_, i) => ({ id: i }));
}

export default async function sitemap(props: {
  id: unknown;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const rows = await getChunkRows(id);
  return rows.map((d) => ({
    url: `${SITE_URL}${doctorPath(d)}`,
  }));
}