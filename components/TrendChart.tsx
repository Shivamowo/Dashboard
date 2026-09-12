"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import { EmptyState } from "./ui";
import { CHART_AXIS, CHART_GRID, CHART_INK, CHART_SERIES, CHART_SURFACE } from "./chartTokens";

export interface SeriesDef {
  key: string;
  label: string;
}

interface Props {
  data: Record<string, string | number>[];
  xKey: string;
  series: SeriesDef[];
  variant?: "line" | "bar";
  height?: number;
  yLabel?: string;
  emptyMessage?: string;
}

const axisProps = {
  stroke: CHART_AXIS,
  tick: { fill: CHART_AXIS, fontSize: 12 },
  tickLine: false,
} as const;

export default function TrendChart({
  data,
  xKey,
  series,
  variant = "line",
  height = 260,
  yLabel,
  emptyMessage = "There are no figures for this period yet. The chart fills in once the department reports them.",
}: Props) {
  const hasData =
    data.length > 0 && data.some((row) => series.some((s) => Number(row[s.key] ?? 0) > 0));

  if (!hasData) {
    return (
      <EmptyState title="Nothing to plot" message={emptyMessage} icon={LineChartIcon} />
    );
  }

  const tooltip = {
    contentStyle: {
      borderRadius: 10,
      border: "1px solid " + CHART_GRID,
      backgroundColor: CHART_SURFACE,
      fontSize: 13,
      color: CHART_INK,
      padding: "8px 12px",
      boxShadow: "0 1px 2px rgba(20,19,18,.06), 0 8px 24px rgba(20,19,18,.06)",
    },
    labelStyle: { color: CHART_INK, fontWeight: 600, marginBottom: 4 },
  };

  const legend =
    series.length > 1 ? (
      <Legend
        wrapperStyle={{ fontSize: 12, color: CHART_INK, paddingTop: 8 }}
        iconType="circle"
        iconSize={8}
      />
    ) : null;

  const yAxis = (
    <YAxis
      {...axisProps}
      axisLine={false}
      width={46}
      label={
        yLabel
          ? { value: yLabel, angle: -90, position: "insideLeft", fill: CHART_AXIS, fontSize: 11 }
          : undefined
      }
    />
  );

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }} barGap={2}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey={xKey} {...axisProps} axisLine={{ stroke: CHART_GRID }} />
            {yAxis}
            <Tooltip {...tooltip} cursor={{ fill: CHART_GRID, fillOpacity: 0.6 }} />
            {legend}
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={CHART_SERIES[i % CHART_SERIES.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={34}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey={xKey} {...axisProps} axisLine={{ stroke: CHART_GRID }} />
            {yAxis}
            <Tooltip {...tooltip} cursor={{ stroke: CHART_AXIS, strokeDasharray: "3 3" }} />
            {legend}
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={CHART_SERIES[i % CHART_SERIES.length]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: CHART_SURFACE }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: CHART_SURFACE }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
