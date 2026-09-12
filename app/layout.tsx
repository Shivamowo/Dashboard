import type { Metadata } from "next";
import { IBM_Plex_Sans, Spectral } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import { getSessionRole } from "@/lib/session";

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
  // Demo session — see lib/demo-accounts.ts. Signed-out pages (login) get a
  // plain shell with no navigation rail.
  const role = getSessionRole();

  return (
    <html lang="en" className={`${plex.variable} ${spectral.variable}`}>
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-brand-ink focus:px-4 focus:py-2 focus:text-body focus:text-paper"
        >
          Skip to content
        </a>

        {role ? (
          <AppShell role={role} logout={<LogoutButton />}>
            {children}
          </AppShell>
        ) : (
          <main id="main" className="mx-auto max-w-[110rem] px-4 py-7 sm:px-7">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
