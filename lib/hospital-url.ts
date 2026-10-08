import { SITE_URL } from "@/lib/doctor-url";

export { SITE_URL };

const KEEP_UPPER = new Set([
  "LLC", "PLLC", "LP", "LLP", "PC", "PA", "II", "III", "IV", "VA", "USA", "UT", "UCLA", "UCSF", "HCA", "ER", "ICU", "MD", "DBA",
]);

export function hospitalTitle(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part === "") return part;
      const bare = part.replace(/[^a-z]/g, "").toUpperCase();
      if (KEEP_UPPER.has(bare)) {
        return part.toUpperCase();
      }
      return part.replace(/(^|[-/(&'])([a-z])/g, (_m, p, c) => p + c.toUpperCase());
    })
    .join("");
}

export function hospitalCity(city: string | null | undefined): string {
  if (!city) return "";
  return city
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_m, p, c) => p + c.toUpperCase());
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type HospitalLike = {
  npi_number: string | null;
  name: string | null;
  city: string | null;
  state: string | null;
};

export function hospitalSlug(h: HospitalLike): string {
  const namePart = slugify(h.name || "hospital").slice(0, 60).replace(/-+$/g, "");
  const parts = [namePart, slugify(h.city || ""), slugify(h.state || ""), h.npi_number || ""].filter(Boolean);
  return parts.join("-");
}

export function hospitalPath(h: HospitalLike): string {
  return `/hospital/${hospitalSlug(h)}`;
}

export function npiFromHospitalSlug(slug: string): string | null {
  const last = slug.split("-").pop() || "";
  return /^\d{10}$/.test(last) ? last : null;
}

export function hospitalPhone(phone: string | null | undefined): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone || "";
}