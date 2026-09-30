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
  metadataBase: new URL("https://getmdscout.com"),
  title: {
    default: "MDScout - Find Doctors & Hospitals Near You",
    template: "%s | MDScout",
  },
  description:
    "Search 800,000+ NPI-verified US doctors and 70,000+ hospitals. Free provider directory, updated daily.",
  openGraph: {
    type: "website",
    siteName: "MDScout",
    title: "MDScout - Find Doctors & Hospitals Near You",
    description:
      "Search NPI-verified US doctors and hospitals by specialty, city, insurance, or distance.",
    url: "/",
  },
  robots: { index: true, follow: true },
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
        {/* Page Content */}
        <main className="flex-grow">{children}</main>

        {/* Global Footer */}
        <footer className="w-full border-t border-slate-200 py-6 bg-white mt-auto">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2026 MDScout. All rights reserved.</p>
            <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
             <Link href="/terms" className="hover:text-slate-800 transition-colors">Terms of Service</Link>
              <Link href="/refund-policy" className="hover:text-slate-800 transition-colors">Refund Policy</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}