import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Landmark,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ROLES } from "@/components/roles";
import { rollupUniversity } from "@/lib/aggregate";
import { CURRENT_FACULTY_ID, CURRENT_HOD_DEPT_ID, departmentById, facultyById } from "@/data";

const ICONS: Record<string, LucideIcon> = {
  Landmark,
  ClipboardList,
  Users,
  UserRound,
  Wrench,
};

export default function Home() {
  const uni = rollupUniversity();
  const hodDept = departmentById(CURRENT_HOD_DEPT_ID);
  const me = facultyById(CURRENT_FACULTY_ID);

  const context: Record<string, string> = {
    vc: `${uni.deptCount} departments · ${uni.facultyCount} faculty on record`,
    registrar: `${uni.programCount} programmes · ${uni.facultyCount} faculty on record`,
    hod: `Opens as ${hodDept?.hodName}, ${hodDept?.shortName}`,
    faculty: `Opens as ${me?.name}`,
    et: `${uni.infraRooms} rooms across ${uni.deptCount} departments`,
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-9">
        <p className="font-display text-h1 font-semibold leading-tight text-ink-900">
          Department performance records,
          <br />
          read the way each office needs them.
        </p>
        <p className="mt-4 max-w-[60ch] text-lead text-ink-600">
          The same submission — programmes, faculty, research, targets and rooms — opens at a
          different depth for each office. Pick yours to begin.
        </p>
      </header>

      <ul className="divide-y divide-ink-200 border-y border-ink-200">
        {ROLES.map((r) => {
          const Icon = ICONS[r.icon];
          return (
            <li key={r.id}>
              <Link
                href={r.home}
                className="group flex items-center gap-4 py-5 transition-colors hover:bg-paper-sunken/60"
              >
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-ink-200 bg-paper-raised text-ink-500 transition-colors group-hover:border-seal-300 group-hover:bg-seal-50 group-hover:text-seal-700"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-h3 font-semibold text-ink-900 group-hover:text-seal-700">
                    {r.label}
                  </span>
                  <span className="mt-1 block text-body text-ink-600">{r.scope}</span>
                  <span className="mt-1.5 block text-micro tnum text-ink-500">
                    {context[r.id]}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-ink-300 transition-colors group-hover:text-seal-600"
                />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-micro text-ink-500">
        No sign-in is required. Figures are sample data and nothing you open here is saved.
      </p>
    </div>
  );
}
