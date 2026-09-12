import { BarChart3, DoorOpen, MonitorSmartphone, TriangleAlert, Users } from "lucide-react";
import { departments, infrastructure, infrastructureByDept, utilisationFlag } from "@/data";
import { deptNameMap } from "@/lib/rows";
import InfrastructureTable from "@/components/tables/InfrastructureTable";
import TrendChart from "@/components/TrendChart";
import {
  KpiCard,
  KpiRow,
  PageHeading,
  ProgressBar,
  Section,
  StatusBadge,
} from "@/components/ui";

export default function EtDashboard() {
  const deptNames = deptNameMap();
  const rooms = infrastructure;

  const avgUtil =
    Math.round((rooms.reduce((a, r) => a + r.utilisationPct, 0) / (rooms.length || 1)) * 10) / 10;
  const under = rooms.filter((r) => utilisationFlag(r.utilisationPct) === "Under-utilised").length;
  const over = rooms.filter((r) => utilisationFlag(r.utilisationPct) === "Over-utilised").length;
  const capacity = rooms.reduce((a, r) => a + r.studentCapacity, 0);
  const smartBoards = rooms.filter((r) => r.digitalSmartBoard).length;

  const byDept = departments.map((d) => {
    const rows = infrastructureByDept(d.id);
    return {
      dept: d.shortName,
      name: d.name,
      utilisation:
        Math.round((rows.reduce((a, r) => a + r.utilisationPct, 0) / (rows.length || 1)) * 10) / 10,
      rooms: rows.length,
      capacity: rows.reduce((a, r) => a + r.studentCapacity, 0),
      allotted: rows.reduce((a, r) => a + r.hoursAllottedPerWeek, 0),
      used: rows.reduce((a, r) => a + r.currentWeeklyWorkingHours, 0),
      under: rows.filter((r) => utilisationFlag(r.utilisationPct) === "Under-utilised").length,
      over: rows.filter((r) => utilisationFlag(r.utilisationPct) === "Over-utilised").length,
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
            tone={avgUtil < 60 ? "caution" : "positive"}
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
        >
          <TrendChart
            data={byDept.map((d) => ({ dept: d.dept, utilisation: d.utilisation }))}
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
                    <td className="td text-right">{d.capacity}</td>
                    <td className="td text-right">{d.allotted}</td>
                    <td className="td text-right">{d.used}</td>
                    <td className="td min-w-[9rem]">
                      <ProgressBar value={d.utilisation} srLabel={`${d.name} utilisation`} />
                    </td>
                    <td className="td">
                      <span className="flex flex-wrap gap-1">
                        {d.under > 0 ? <StatusBadge status="Under-utilised" /> : null}
                        {d.over > 0 ? <StatusBadge status="Over-utilised" /> : null}
                        {d.under === 0 && d.over === 0 ? <StatusBadge status="Optimal" /> : null}
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
        >
          <InfrastructureTable rows={rooms} deptNames={deptNames} showDept />
        </Section>
      </div>
    </div>
  );
}
