import { SITE_URL } from "@/lib/doctor-url";
import { getChunkCount } from "@/lib/doctor-sitemap";

export const revalidate = 86400;

export async function GET() {
  const n = await getChunkCount();
  const urls = [
    `${SITE_URL}/sitemap.xml`,
    ...Array.from(
      { length: n },
      (_, i) => `${SITE_URL}/doctor-sitemaps/sitemap/${i}.xml`
    ),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <sitemap><loc>${u}</loc></sitemap>`).join("\n") +
    `\n</sitemapindex>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml" },
  });
}