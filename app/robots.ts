import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/doctor-dashboard"],
    },
    sitemap: "https://getmdscout.com/sitemap.xml",
  };
}