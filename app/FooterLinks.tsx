import Link from "next/link";
import { STATE_NAMES } from "@/lib/hub";

const TOP_STATES = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI", "NJ", "VA"];

export default function FooterLinks() {
  return (
    <div className="max-w-7xl mx-auto px-4 pb-8 grid grid-cols-1 gap-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-base text-white">
            🛡️
          </span>
          <span className="text-lg font-extrabold tracking-tight text-blue-900">
            MDScout<span className="text-blue-600">.io</span>
          </span>
        </Link>
        <p className="mt-3 text-slate-500">
          Your trusted source for finding verified healthcare providers across the United States.
        </p>
        <p className="mt-3 text-slate-500">
          <a href="mailto:support@mdscout.io" className="hover:text-blue-600">
            support@mdscout.io
          </a>
          {" · "}
          <Link href="/contact" className="hover:text-blue-600">
            Contact Us
          </Link>
        </p>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-slate-800">Explore</h2>
        <ul className="space-y-1.5 text-slate-500">
          <li>
            <Link href="/" className="hover:text-blue-600">Find Doctors</Link>
          </li>
          <li>
            <Link href="/hospitals" prefetch={false} className="hover:text-blue-600">Find Hospitals</Link>
          </li>
          <li>
            <Link href="/health-news" prefetch={false} className="hover:text-blue-600">Health News</Link>
          </li>
          <li>
            <Link href="/about" prefetch={false} className="hover:text-blue-600">About Us</Link>
          </li>
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-slate-800">Doctors by state</h2>
        <ul className="space-y-1.5 text-slate-500">
          {TOP_STATES.map((code) => (
            <li key={code}>
              <Link
                href={`/doctors/${code.toLowerCase()}`}
                prefetch={false}
                className="hover:text-blue-600"
              >
                Doctors in {STATE_NAMES[code]}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-slate-800">Hospitals by state</h2>
        <ul className="space-y-1.5 text-slate-500">
          {TOP_STATES.map((code) => (
            <li key={code}>
              <Link
                href={`/hospitals/${code.toLowerCase()}`}
                prefetch={false}
                className="hover:text-blue-600"
              >
                Hospitals in {STATE_NAMES[code]}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}