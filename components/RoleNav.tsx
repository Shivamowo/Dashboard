"use client";

import {
  ClipboardList,
  Landmark,
  ShieldCheck,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ROLE_SECTIONS, roleMeta } from "./roles";
import type { Role } from "@/data";

const ICONS: Record<string, LucideIcon> = {
  Landmark,
  ClipboardList,
  Users,
  UserRound,
  Wrench,
  ShieldCheck,
};

/**
 * Shows the signed-in role only. Roles are fixed at login, so no other role is
 * rendered here — there is nothing to switch to.
 */
export default function RoleNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const meta = roleMeta(role);
  const Icon = ICONS[meta.icon];
  const sections = ROLE_SECTIONS[role];

  return (
    <nav aria-label="Sections" className="flex flex-col gap-1">
      <div className="relative flex items-start gap-3 overflow-hidden rounded-control border-l-2 border-brand-pink bg-brand-pink/15 px-3 py-2.5 text-paper">
        
        <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-pink-200" />
        <span className="min-w-0">
          <span className="block text-body font-medium">{meta.label}</span>
          <span className="mt-0.5 block text-micro leading-snug text-ink-300">{meta.scope}</span>
        </span>
      </div>

      {sections.length > 0 ? (
        <ul className="ml-[1.6rem] mt-1 space-y-0.5 border-l border-brand-ink-lighter pl-3">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={onNavigate}
                className="block rounded-control px-2 py-1 text-micro text-ink-400 transition-colors hover:bg-brand-ink-light hover:text-paper"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}
