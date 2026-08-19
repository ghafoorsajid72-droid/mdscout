import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MDScout - Medical Provider Directory & API",
  description: "Search doctors, hospitals, and medical specialties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        {/* Global Header / Navbar */}
        <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl text-blue-600 tracking-tight">
              MDScout
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
              <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
              <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
            </nav>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow">{children}</main>

        {/* Global Footer */}
        <footer className="w-full border-t border-slate-200 py-6 bg-white mt-auto">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2026 MDScout. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-800 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}