import { NextResponse } from "next/server";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  try {
    const res = await fetch("https://www.medlineplus.gov/groupfeeds/new.xml", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch feed" }, { status: 502 });
    }

    const xml = await res.text();

    const items: { title: string; link: string; description: string; pubDate: string }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];

      const getTag = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
        if (!m) return "";
        return m[1]
          .replace("<![CDATA[", "")
          .replace("]]>", "")
          .trim();
      };

      items.push({
        title: getTag("title"),
        link: getTag("link"),
        description: getTag("description"),
        pubDate: getTag("pubDate"),
      });

      if (items.length >= 20) break; // limit to latest 20
    }

    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}