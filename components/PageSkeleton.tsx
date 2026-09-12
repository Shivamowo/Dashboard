import { KpiSkeleton, Skeleton, TableSkeleton } from "./ui";

/** Shared loading shape so every route settles into the same layout. */
export default function PageSkeleton({
  kpis = 6,
  tables = 2,
}: {
  kpis?: number;
  tables?: number;
}) {
  return (
    <div>
      <div className="mb-7 border-b border-ink-200 pb-5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-8 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-[34rem] max-w-full" />
      </div>
      {kpis > 0 ? <KpiSkeleton count={kpis} /> : null}
      <div className="mt-6 space-y-6">
        {Array.from({ length: tables }).map((_, i) => (
          <section key={i} className="panel">
            <div className="panel-head">
              <div className="w-full">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="mt-2 h-3 w-96 max-w-full" />
              </div>
            </div>
            <div className="panel-body">
              <TableSkeleton rows={5} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
