export const SITE_URL = "https://getmdscout.com";

type DoctorLike = {
  first_name?: string | null;
  last_name?: string | null;
  npi_number?: string | number | null;
};

export function titleCase(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .trim();
}

export function doctorName(d: DoctorLike): string {
  return `Dr. ${titleCase(d.first_name)} ${titleCase(d.last_name)}`
    .replace(/\s+/g, " ")
    .trim();
}

export function doctorSlug(d: DoctorLike): string {
  const base = `${d.first_name ?? ""} ${d.last_name ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const npi = String(d.npi_number ?? "");
  return base ? `${base}-${npi}` : npi;
}

export function doctorPath(d: DoctorLike): string {
  return `/doctor/${doctorSlug(d)}`;
}

export function npiFromSlug(slug: string): string | null {
  const last = slug.split("-").pop() ?? "";
  return /^\d{10}$/.test(last) ? last : null;
}

export function formatPhone(p: string | null | undefined): string {
  const digits = (p ?? "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return p ?? "";
}