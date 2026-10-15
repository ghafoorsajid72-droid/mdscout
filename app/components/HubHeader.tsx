import Link from "next/link";

export default function HubHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-blue-600">
          MDScout
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-gray-700">
          <Link href="/" className="hover:text-blue-600">
            Find Doctors
          </Link>
          <Link href="/hospitals" prefetch={false} className="hover:text-blue-600">
            Hospitals
          </Link>
        </nav>

        <form action="/" method="get" className="ml-auto flex w-full gap-2 sm:w-auto">
          <input
            type="text"
            name="q"
            placeholder="Search doctor name..."
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none sm:w-64"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>
    </header>
  );
}