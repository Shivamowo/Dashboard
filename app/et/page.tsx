import { BarChart3, DoorOpen, MonitorSmartphone, TriangleAlert, Users } from "lucide-react";
import {
  avgOf,
  countTrue,
  departments,
  infrastructure,
  infrastructureByDept,
  orZero,
  pendingInfraIds,
  sumOf,
  utilisationFlag,
} from "@/data";
import { deptNameMap } from "@/lib/rows";
import InfrastructureTable from "@/components/tables/InfrastructureTable";
import TrendChart from "@/components/TrendChart";
import {
  KpiCard,
  KpiRow,
  NotProvided,
  PageHeading,
  ProgressBar,
  Section,
  StatusBadge,
} from "@/components/ui";
import { num } from "@/components/cells";

export default function EtDashboard() {
  const deptNames = deptNameMap();
  const rooms = infrastructure;

  // Rooms that never reported a utilisation figure are left out of the average
  // rather than counted as 0%, which would drag every department's figure down.
  const avgUtil = avgOf(rooms, (r) => r.utilisationPct);
  const under = rooms.filter((r) => utilisationFlag(r.utilisationPct) === "Under-utilised").length;
  const over = rooms.filter((r) => utilisationFlag(r.utilisationPct) === "Over-utilised").length;
  const capacity = sumOf(rooms, (r) => r.studentCapacity);
  const smartBoards = countTrue(rooms, (r) => r.digitalSmartBoard);

  const byDept = departments.map((d) => {
    const rows = infrastructureByDept(d.id);
    return {
      dept: d.shortName,
      name: d.name,
      // Nullable throughout: a department whose rooms reported no utilisation
      // must not show a measured-looking 0%, and one with no rooms at all is
      // not "optimally utilised" — both are gaps, not findings.
      utilisation: avgOf(rows, (r) => r.utilisationPct),
      rooms: rows.length,
      capacity: sumOf(rows, (r) => r.studentCapacity),
      allotted: sumOf(rows, (r) => r.hoursAllottedPerWeek),
      used: sumOf(rows, (r) => r.currentWeeklyWorkingHours),
      under: rows.filter((r) => utilisationFlag(r.utilisationPct) === "Under-utilised").length,
      over: rows.filter((r) => utilisationFlag(r.utilisationPct) === "Over-utilised").length,
      /** Rooms that actually carry a utilisation figure. */
      flagged: rows.filter((r) => utilisationFlag(r.utilisationPct) !== null).length,
    };
  });

  return (
    <div>
      <PageHeading
        crumbs={[{ label: "Engineering & Technical" }]}
        title="Rooms and utilisation"
        subtitle="Laboratories and classrooms across every department. This view carries no faculty, programme or target data."
      />

      <div id="kpis" className="scroll-mt-6">
        <KpiRow>
          <KpiCard
            label="Rooms on register"
            value={rooms.length}
            hint={`Across ${departments.length} departments`}
            icon={DoorOpen}
          />
          <KpiCard
            label="Average utilisation"
            value={avgUtil}
            unit="%"
            tone={avgUtil != null && avgUtil < 60 ? "caution" : "positive"}
            icon={BarChart3}
          />
          <KpiCard
            label="Under-utilised"
            value={under}
            tone={under > 0 ? "caution" : "positive"}
            hint="Below 60% of allotted hours"
            icon={TriangleAlert}
          />
          <KpiCard
            label="Over-utilised"
            value={over}
            tone={over > 0 ? "alert" : "positive"}
            hint="Above 95% of allotted hours"
            icon={TriangleAlert}
          />
          <KpiCard label="Seats available" value={capacity} icon={Users} />
          <KpiCard
            label="Smart boards fitted"
            value={smartBoards}
            hint={`of ${rooms.length} rooms`}
            icon={MonitorSmartphone}
          />
        </KpiRow>
      </div>

      <div id="trends" className="mt-6 grid scroll-mt-6 grid-cols-1 gap-6 xl:grid-cols-2">
        <Section
          title="Utilisation by department"
          description="Weekly hours used against hours allotted, averaged across each department's rooms."
          icon={BarChart3}
          accent="teal"
        >
          <TrendChart
            // Recharts needs a number per bar; the chart falls back to its own
            // empty state when no department has reported a figure at all.
            data={byDept.map((d) => ({ dept: d.dept, utilisation: orZero(d.utilisation) }))}
            xKey="dept"
            variant="bar"
            yLabel="Utilisation %"
            series={[{ key: "utilisation", label: "Average utilisation" }]}
          />
        </Section>

        <Section
          title="Departmental summary"
          description="Room counts, capacity and where the estate is stretched or idle."
          icon={DoorOpen}
          accent="teal"
        >
          <div className="table-scroll rounded-panel border border-ink-200">
            <table className="w-full min-w-[40rem] border-collapse">
              <caption className="sr-only">
                Room count, capacity, weekly hours and utilisation flags per department
              </caption>
              <thead>
                <tr>
                  {["Department", "Rooms", "Seats", "Hours allotted", "Hours used", "Utilisation", "Flag"].map(
                    (h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={"th " + (i > 0 && i < 5 ? "text-right" : "")}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {byDept.map((d) => (
                  <tr key={d.dept} className="bg-paper-raised transition-colors hover:bg-paper-sunken/60">
                    <th scope="row" className="td text-left font-medium text-ink-900">
                      <span title={d.name}>{d.dept}</span>
                    </th>
                    <td className="td text-right">{d.rooms}</td>
                    <td className="td text-right">{num(d.capacity)}</td>
                    <td className="td text-right">{num(d.allotted)}</td>
                    <td className="td text-right">{num(d.used)}</td>
                    <td className="td min-w-[9rem]">
                      {d.utilisation == null ? (
                        <NotProvided />
                      ) : (
                        <ProgressBar value={d.utilisation} srLabel={`${d.name} utilisation`} />
                      )}
                    </td>
                    <td className="td">
                      <span className="flex flex-wrap gap-1">
                        {/* "Optimal" is only meaningful once at least one room
                            has reported a figure; otherwise there is nothing to
                            judge and the cell says so. */}
                        {d.flagged === 0 ? (
                          <NotProvided />
                        ) : (
                          <>
                            {d.under > 0 ? <StatusBadge status="Under-utilised" /> : null}
                            {d.over > 0 ? <StatusBadge status="Over-utilised" /> : null}
                            {d.under === 0 && d.over === 0 ? <StatusBadge status="Optimal" /> : null}
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <div className="mt-6">
        <Section
          id="register"
          title="Room register"
          description="Every reported field for each room. Filter by department or utilisation flag."
          icon={DoorOpen}
          accent="teal"
        >
          <InfrastructureTable
            rows={rooms}
            deptNames={deptNames}
            showDept
            pendingIds={pendingInfraIds()}
            editHrefBase="/et/infra"
          />
        </Section>
      </div>
    </div>
  );
}
