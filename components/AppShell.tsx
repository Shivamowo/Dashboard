"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import RoleNav from "./RoleNav";
import { roleMeta } from "./roles";
import type { Role } from "@/data";

export default function AppShell({
  role,
  logout,
  children,
}: {
  role: Role;
  logout: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const meta = roleMeta(role);

  const brand = (
    <div className="flex items-start gap-3 px-1 py-1">
      {/* University seal — never recoloured, min 32px, 8px clear space (design.md §3). */}
      <Image
        src="/vbspu-logo.png"
        alt=""
        aria-hidden
        width={40}
        height={40}
        className="mt-0.5 h-10 w-10 shrink-0"
        priority
      />
      <span className="min-w-0">
        <span className="block font-display text-lead font-semibold leading-tight text-paper">
          Department Records
        </span>
        <span className="mt-0.5 block text-micro leading-snug text-ink-400">
          V.B.S. Purvanchal University, Jaunpur
        </span>
      </span>
    </div>
  );

  const footer = (
    <div className="space-y-3">
      <div>
        <p className="text-micro text-ink-500">Signed in as</p>
        <p className="mt-0.5 text-meta font-medium text-ink-300">{meta.label}</p>
      </div>
      {logout}
      <p className="text-micro leading-relaxed text-ink-500">
        Demonstration build. Figures are sample data and nothing is saved.
      </p>
    </div>
  );

  return (
    <div className="lg:flex">
      {/* Tablet and below: a bar that opens the same navigation as a drawer. */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-brand-ink-lighter bg-brand-ink px-4 py-3 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="section-drawer"
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="rounded-control border border-brand-ink-lighter p-2 text-ink-300 transition-colors hover:bg-brand-ink-light hover:text-paper active:bg-brand-ink-lighter"
        >
          {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div
          id="section-drawer"
          className="sticky top-[3.75rem] z-30 space-y-5 border-b border-brand-ink-lighter bg-brand-ink px-4 py-4 lg:hidden"
        >
          <RoleNav role={role} onNavigate={() => setOpen(false)} />
          <div className="border-t border-brand-ink-lighter pt-4">{footer}</div>
        </div>
      ) : null}

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-[17.5rem] shrink-0 flex-col justify-between overflow-y-auto border-r border-brand-ink-lighter bg-brand-ink px-4 py-5 lg:flex">
        <div>
          {brand}
          <p className="mb-3 mt-6 px-1 text-micro font-semibold text-ink-500">Your view</p>
          <RoleNav role={role} />
        </div>
        <div className="mt-6 border-t border-brand-ink-lighter px-1 pt-4">{footer}</div>
      </aside>

      <div className="min-w-0 flex-1">
        <main id="main" className="mx-auto max-w-[110rem] px-4 py-7 sm:px-7 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
