"use client";

import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Landmark,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ROLES, ROLE_SECTIONS } from "./roles";
import type { Role } from "@/data";

const ICONS: Record<string, LucideIcon> = {
  Landmark,
  ClipboardList,
  Users,
  UserRound,
  Wrench,
};

/**
 * The role switcher doubles as the primary navigation: the active role expands
 * to reveal that view's sections, so the current page is always evident.
 */
export default function RoleSwitcher({
  active,
  onNavigate,
}: {
  active: Role | null;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const sections = active ? ROLE_SECTIONS[active] : [];

  const go = (role: Role) => {
    const target = ROLES.find((r) => r.id === role);
    if (target) {
      router.push(target.home);
      onNavigate?.();
    }
  };

  return (
    <nav aria-label="Roles" className="flex flex-col gap-1">
      {ROLES.map((r) => {
        const Icon = ICONS[r.icon];
        const isActive = r.id === active;
        return (
          <div key={r.id}>
            <button
              type="button"
              onClick={() => go(r.id)}
              aria-current={isActive ? "page" : undefined}
              className={
                "group relative flex w-full items-start gap-3 rounded-control px-3 py-2.5 text-left transition-colors " +
                (isActive
                  ? "bg-ink-800 text-paper"
                  : "text-ink-300 hover:bg-ink-900 hover:text-paper active:bg-ink-800")
              }
            >
              {isActive ? (
                <span
                  aria-hidden
                  className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-seal-400"
                />
              ) : null}
              <Icon
                aria-hidden
                className={"mt-0.5 h-4 w-4 shrink-0 " + (isActive ? "text-seal-300" : "text-ink-400")}
              />
              <span className="min-w-0">
                <span className="block text-body font-medium">{r.label}</span>
                <span
                  className={
                    "mt-0.5 block text-micro leading-snug " +
                    (isActive ? "text-ink-300" : "text-ink-500")
                  }
                >
                  {r.scope}
                </span>
              </span>
            </button>

            {isActive && sections.length > 0 ? (
              <ul className="mb-1 ml-[1.6rem] mt-1 space-y-0.5 border-l border-ink-700 pl-3">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={onNavigate}
                      className="block rounded-control px-2 py-1 text-micro text-ink-400 transition-colors hover:bg-ink-900 hover:text-paper"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
