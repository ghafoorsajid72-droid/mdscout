import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://getmdscout.com";
  const pages = [
    "", "/hospitals", "/health-news",
    "/pricing", "/plus", "/about", "/contact",
    "/privacy", "/terms", "/refund-policy",
  ];
  return pages.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));
}