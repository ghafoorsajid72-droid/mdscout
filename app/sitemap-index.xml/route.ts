import { SITE_URL } from "@/lib/doctor-url";
import { getChunkCount } from "@/lib/doctor-sitemap";
import { getHospitalChunkCount } from "@/lib/hospital-sitemap";
import { getSpecialtyChunkCount } from "@/lib/hub-sitemap";

export const revalidate = 604800;

export async function GET() {
  const [doctorChunks, hospitalChunks, specialtyChunks] = await Promise.all([
    getChunkCount(),
    getHospitalChunkCount(),
    getSpecialtyChunkCount(),
  ]);

  const urls: string[] = [`${SITE_URL}/sitemap.xml`];
  for (let i = 0; i < doctorChunks; i++) {
    urls.push(`${SITE_URL}/doctor-sitemaps/sitemap/${i}.xml`);
  }
  for (let i = 0; i < hospitalChunks; i++) {
    urls.push(`${SITE_URL}/hospital-sitemaps/sitemap/${i}.xml`);
  }
  const hubChunks = specialtyChunks + 2;
  for (let i = 0; i < hubChunks; i++) {
    urls.push(`${SITE_URL}/hub-sitemaps/sitemap/${i}.xml`);
  }

  const body =
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `<sitemap>\n<loc>${u}</loc>\n</sitemap>`).join("\n") +
    `\n</sitemapindex>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate",
    },
  });
}