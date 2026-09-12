"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import RoleSwitcher from "./RoleSwitcher";
import { roleForPath } from "./roles";

export default function AppSidebar() {
  const pathname = usePathname() ?? "/";
  const active = roleForPath(pathname);
  const [open, setOpen] = useState(false);

  const brand = (
    <Link
      href="/"
      onClick={() => setOpen(false)}
      className="group flex items-start gap-3 rounded-control px-1 py-1"
    >
      <span
        aria-hidden
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-brass-500/40 bg-ink-900 font-display text-meta font-semibold text-brass-200"
      >
        VB
      </span>
      <span className="min-w-0">
        <span className="block font-display text-lead font-semibold leading-tight text-paper group-hover:text-brass-200">
          Department Records
        </span>
        <span className="mt-0.5 block text-micro leading-snug text-ink-400">
          V.B.S. Purvanchal University, Jaunpur
        </span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Tablet and below: a bar that opens the same navigation as a drawer. */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-ink-800 bg-ink-950 px-4 py-3 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="role-drawer"
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="rounded-control border border-ink-700 p-2 text-ink-300 transition-colors hover:bg-ink-900 hover:text-paper active:bg-ink-800"
        >
          {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div
          id="role-drawer"
          className="sticky top-[3.75rem] z-30 border-b border-ink-800 bg-ink-950 px-4 py-4 lg:hidden"
        >
          <RoleSwitcher active={active} onNavigate={() => setOpen(false)} />
        </div>
      ) : null}

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-[17.5rem] shrink-0 flex-col justify-between overflow-y-auto border-r border-ink-800 bg-ink-950 px-4 py-5 lg:flex">
        <div>
          {brand}
          <p className="mb-3 mt-6 px-1 text-micro font-semibold text-ink-500">Viewing as</p>
          <RoleSwitcher active={active} />
        </div>
        <p className="mt-6 border-t border-ink-800 px-1 pt-4 text-micro leading-relaxed text-ink-500">
          Demonstration build. Figures are sample data and nothing is saved.
        </p>
      </aside>
    </>
  );
}
