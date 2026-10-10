import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/hospital-url";
import { getSpecialtyChunkCount, getHubPaths } from "@/lib/hub-sitemap";

export const revalidate = 604800;

export async function generateSitemaps() {
  const n = await getSpecialtyChunkCount();
  return Array.from({ length: n + 2 }, (_, i) => ({ id: i }));
}

export default async function sitemap(props: { id: unknown }): Promise<MetadataRoute.Sitemap> {
  const raw = await (props as { id: unknown }).id;
  const id = Number(raw);
  const paths = await getHubPaths(Number.isFinite(id) ? id : 0);
  return paths.map((p) => ({ url: `${SITE_URL}${p}` }));
}