import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const blocked = ["/admin", "/api", "/doctor-dashboard"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: blocked,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: blocked,
        crawlDelay: 10,
      },
    ],
    sitemap: "https://getmdscout.com/sitemap.xml",
  };
}