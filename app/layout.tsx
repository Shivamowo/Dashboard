import type { Metadata } from "next";
import { IBM_Plex_Sans, Spectral } from "next/font/google";
import "./globals.css";
import AppSidebar from "@/components/AppSidebar";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Department Records — V.B.S. Purvanchal University",
  description:
    "Role-based department performance records for Veer Bahadur Singh Purvanchal University, Jaunpur.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plex.variable} ${spectral.variable}`}>
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-ink-950 focus:px-4 focus:py-2 focus:text-body focus:text-paper"
        >
          Skip to content
        </a>

        <div className="lg:flex">
          <AppSidebar />
          <div className="min-w-0 flex-1">
            <main id="main" className="mx-auto max-w-[110rem] px-4 py-7 sm:px-7 lg:py-9">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
