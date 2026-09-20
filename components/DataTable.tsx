"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "./ui";

export type SortValue = string | number | boolean | null | undefined;

export interface Column<T> {
  key: string;
  header: string;
  /** Value used for sorting, filtering and text search. */
  value: (row: T) => SortValue;
  /** Optional rich cell renderer; falls back to the raw value. */
  render?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /** Tailwind width / min-width class for wide tables. */
  className?: string;
  sortable?: boolean;
  /** Long free-text columns get a wider, wrapping cell. */
  wrap?: boolean;
  /** Header group shown above related columns (e.g. "Sanctioned intake"). */
  group?: string;
  /**
   * Below `md` each row is a stacked card showing up to 3 primary fields; the
   * rest sit behind a "Details" expander. Columns flagged `primary` are shown
   * first (in column order); if fewer than 3 are flagged, the leading columns
   * fill the remainder.
   */
  primary?: boolean;
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  match: (row: T, value: string) => boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Makes a row clickable — navigates on click and on Enter. */
  rowHref?: (row: T) => string;
  /** Describes what a row click opens, for screen readers. */
  rowActionLabel?: (row: T) => string;
  filters?: FilterDef<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  initialSortKey?: string;
  initialSortDir?: "asc" | "desc";
  /** Shown when the source data itself is empty. */
  emptyTitle?: string;
  emptyMessage?: string;
  /** Shown when filters exclude every row. */
  noMatchMessage?: string;
  stickyFirstColumn?: boolean;
  /** Accessible description of the table for screen readers. */
  caption?: string;
  pageSize?: number;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  rowActionLabel,
  filters = [],
  searchable = false,
  searchPlaceholder = "Search records",
  initialSortKey,
  initialSortDir = "asc",
  emptyTitle = "No records yet",
  emptyMessage = "This register has no entries. Rows appear here once the department submits them.",
  noMatchMessage = "No rows match the filters you have applied. Clear them to see the full register.",
  stickyFirstColumn = false,
  caption,
  pageSize,
}: Props<T>) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);
  const [query, setQuery] = useState("");
  const [filterState, setFilterState] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);

  const hasActiveFilters =
    query.trim().length > 0 || Object.values(filterState).some((v) => v && v !== "all");

  const processed = useMemo(() => {
    let out = rows.slice();

    for (const f of filters) {
      const v = filterState[f.key];
      if (v && v !== "all") out = out.filter((row) => f.match(row, v));
    }

    if (searchable && query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((row) =>
        columns.some((c) => String(c.value(row) ?? "").toLowerCase().includes(q))
      );
    }

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        out.sort((a, b) => {
          const av = col.value(a);
          const bv = col.value(b);
          // Unreported values sink to the bottom in BOTH directions. Sorting
          // them as 0 or "" would park every department that left a column
          // blank at the top of an ascending sort and read as a real low score.
          const aEmpty = av === null || av === undefined || av === "";
          const bEmpty = bv === null || bv === undefined || bv === "";
          if (aEmpty || bEmpty) {
            if (aEmpty && bEmpty) return 0;
            return aEmpty ? 1 : -1;
          }
          let cmp: number;
          if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
          else if (typeof av === "boolean" && typeof bv === "boolean")
            cmp = Number(av) - Number(bv);
          else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, columns, filters, filterState, query, searchable, sortKey, sortDir]);

  const visible = pageSize && !showAll ? processed.slice(0, pageSize) : processed;

  const clearFilters = () => {
    setQuery("");
    setFilterState({});
  };

  const toggleSort = (col: Column<T>) => {
    if (col.sortable === false) return;
    if (sortKey === col.key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  };

  const alignOf = (a?: Column<T>["align"]) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  const hasControls = searchable || filters.length > 0;

  // Mobile card fields: up to 3 primary columns, the rest behind "Details".
  const dataCols = columns.filter((c) => c.sortable !== false || c.key !== "edit");
  const flagged = dataCols.filter((c) => c.primary);
  const primaryCols = [...flagged, ...dataCols.filter((c) => !c.primary)].slice(0, 3);
  const detailCols = columns.filter((c) => !primaryCols.includes(c));

  /* Source data is genuinely empty — no filter bar, just an invitation. */
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div>
      {hasControls ? (
        <div className="mb-4 grid grid-cols-2 gap-3 border-b border-ink-200 pb-4 sm:flex sm:flex-row sm:flex-wrap sm:items-end">
          {searchable ? (
            <div className="col-span-2 sm:w-64">
              <label className="field-label" htmlFor="dt-search">
                Search
              </label>
              <div className="relative mt-1.5">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                />
                <input
                  id="dt-search"
                  type="search"
                  className="input pl-9"
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {filters.map((f) => (
            <div key={f.key} className="sm:w-52">
              <label className="field-label" htmlFor={"dt-f-" + f.key}>
                {f.label}
              </label>
              <select
                id={"dt-f-" + f.key}
                className="input mt-1.5"
                value={filterState[f.key] ?? "all"}
                onChange={(e) => setFilterState((s) => ({ ...s, [f.key]: e.target.value }))}
              >
                <option value="all">All</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="col-span-2 flex items-center gap-3 sm:ml-auto sm:pb-2">
            <p className="text-micro tnum text-ink-500" aria-live="polite">
              Showing {processed.length} of {rows.length}
            </p>
            {hasActiveFilters ? (
              <button type="button" onClick={clearFilters} className="btn-quiet">
                <SlidersHorizontal aria-hidden className="h-3.5 w-3.5" />
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {processed.length === 0 ? (
        <EmptyState
          title="No matching records"
          message={noMatchMessage}
          action={
            <button type="button" onClick={clearFilters} className="btn-link">
              Clear filters
            </button>
          }
        />
      ) : (
        <>
        {/* Below md: stacked cards instead of a horizontally scrolling table. */}
        <div className="md:hidden">
          <div className="mb-3 flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label className="field-label" htmlFor="dt-m-sort">
                Sort by
              </label>
              <select
                id="dt-m-sort"
                className="input mt-1.5"
                value={sortKey ?? ""}
                onChange={(e) => {
                  setSortKey(e.target.value || undefined);
                  setSortDir("asc");
                }}
              >
                <option value="">Default order</option>
                {columns
                  .filter((c) => c.sortable !== false)
                  .map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.header}
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="button"
              className="btn-quiet shrink-0"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              aria-label={sortDir === "asc" ? "Ascending — switch to descending" : "Descending — switch to ascending"}
            >
              {sortDir === "asc" ? <ArrowUp aria-hidden className="h-3.5 w-3.5" /> : <ArrowDown aria-hidden className="h-3.5 w-3.5" />}
              {sortDir === "asc" ? "Asc" : "Desc"}
            </button>
          </div>
          <ul className="space-y-3">
            {visible.map((row) => {
              const href = rowHref?.(row);
              const [title, ...rest] = primaryCols;
              const cell = (c: Column<T>) => (c.render ? c.render(row) : String(c.value(row) ?? "—"));
              return (
                <li key={rowKey(row)} className="panel min-w-0 px-4 py-3">
                  <div className="min-w-0 break-words font-medium text-ink-900">
                    {href ? (
                      <Link
                        href={href}
                        aria-label={rowActionLabel?.(row)}
                        className="rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                      >
                        {cell(title)}
                      </Link>
                    ) : (
                      cell(title)
                    )}
                  </div>
                  <dl className="mt-2 grid grid-cols-1 gap-y-1.5 text-meta">
                    {rest.map((c) => (
                      <div key={c.key} className="flex items-baseline justify-between gap-3">
                        <dt className="shrink-0 text-micro text-ink-500">{c.header}</dt>
                        <dd className="min-w-0 break-words text-right text-ink-800">{cell(c)}</dd>
                      </div>
                    ))}
                  </dl>
                  {detailCols.length > 0 ? (
                    <details className="group mt-2 border-t border-ink-100 pt-2">
                      <summary className="btn-link cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">Details</span>
                        <span className="hidden group-open:inline">Hide details</span>
                      </summary>
                      <dl className="mt-2 grid grid-cols-1 gap-y-2 text-meta">
                        {detailCols.map((c) => (
                          <div key={c.key} className="min-w-0">
                            <dt className="text-micro text-ink-500">{c.header}</dt>
                            <dd className="break-words text-ink-800">{cell(c)}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="table-scroll hidden rounded-panel border border-ink-200 md:block">
          <table className="w-full min-w-full border-collapse">
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <thead>
              <tr>
                {columns.map((c, i) => {
                  const isSorted = sortKey === c.key;
                  const sticky =
                    stickyFirstColumn && i === 0
                      ? "sticky left-0 z-20 bg-paper-sunken shadow-[1px_0_0_0_theme(colors.ink.200)]"
                      : "";
                  const SortIcon = isSorted
                    ? sortDir === "asc"
                      ? ArrowUp
                      : ArrowDown
                    : ChevronsUpDown;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={
                        isSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                      }
                      className={
                        "th " + alignOf(c.align) + " " + sticky + " " + (c.className ?? "")
                      }
                    >
                      {c.sortable === false ? (
                        <span>{c.header}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleSort(c)}
                          title={`Sort by ${c.header}`}
                          className={
                            "inline-flex items-center gap-1.5 rounded-control px-1 py-0.5 -mx-1 transition-colors hover:text-brand-pink-dark " +
                            (isSorted ? "text-brand-pink-dark" : "")
                          }
                        >
                          {c.header}
                          <SortIcon
                            aria-hidden
                            className={
                              "h-3 w-3 shrink-0 " + (isSorted ? "text-brand-pink-dark" : "text-ink-400")
                            }
                          />
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const href = rowHref?.(row);
                return (
                  <tr
                    key={rowKey(row)}
                    tabIndex={href ? 0 : undefined}
                    role={href ? "link" : undefined}
                    aria-label={href ? rowActionLabel?.(row) : undefined}
                    onClick={href ? () => router.push(href) : undefined}
                    onKeyDown={
                      href
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(href);
                            }
                          }
                        : undefined
                    }
                    className={
                      "group bg-paper-raised " +
                      (href
                        ? "cursor-pointer transition-colors hover:bg-brand-pink-50 focus:bg-brand-pink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-pink active:bg-brand-pink-100"
                        : "transition-colors hover:bg-paper-sunken/60")
                    }
                  >
                    {columns.map((c, ci) => {
                      // The sticky cell needs its own opaque background, and its
                      // own hover state, since it sits above the scrolled row.
                      const sticky =
                        stickyFirstColumn && ci === 0
                          ? "sticky left-0 z-10 bg-paper-raised shadow-[1px_0_0_0_theme(colors.ink.100)] " +
                            (href
                              ? "group-hover:bg-brand-pink-50 group-focus:bg-brand-pink-50"
                              : "group-hover:bg-paper-sunken/60")
                          : "";
                      return (
                        <td
                          key={c.key}
                          className={
                            "td " +
                            alignOf(c.align) +
                            " " +
                            (c.wrap ? "min-w-[16rem] whitespace-normal" : "whitespace-nowrap") +
                            " " +
                            sticky +
                            " " +
                            (c.className ?? "")
                          }
                        >
                          {c.render ? c.render(row) : String(c.value(row) ?? "—")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {pageSize && processed.length > pageSize ? (
        <button type="button" onClick={() => setShowAll((s) => !s)} className="btn-link mt-3">
          {showAll ? "Show fewer rows" : `Show all ${processed.length} rows`}
        </button>
      ) : null}
    </div>
  );
}
