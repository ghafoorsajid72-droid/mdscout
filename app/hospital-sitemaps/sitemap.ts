import type { MetadataRoute } from "next";
import { SITE_URL, hospitalPath } from "@/lib/hospital-url";
import { getHospitalChunkCount, getHospitalChunkRows } from "@/lib/hospital-sitemap";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateSitemaps() {
  const n = await getHospitalChunkCount();
  return Array.from({ length: n }, (_, i) => ({ id: i }));
}

export default async function sitemap(props: { id: unknown }): Promise<MetadataRoute.Sitemap> {
  const raw = await (props as { id: unknown }).id;
  const chunk = Number(raw);
  const rows = await getHospitalChunkRows(Number.isFinite(chunk) ? chunk : 0);
  return rows.map((h) => ({
    url: `${SITE_URL}${hospitalPath(h)}`,
  }));
}