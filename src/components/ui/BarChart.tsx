"use client";

import { ResponsiveBar } from "@nivo/bar";

type Datum = { label: string; value: number };

export function BarChart({ data, unit = "" }: { data: Datum[]; unit?: string }) {
  const chartData = data.map((d) => ({ label: d.label, value: d.value }));
  return (
    <div style={{ height: 300 }}>
      <ResponsiveBar
        data={chartData}
        keys={["value"]}
        indexBy="label"
        margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
        padding={0.3}
        colors={{ scheme: "set2" }}
        theme={{
          text: { fill: "#eaeaea" },
          axis: {
            ticks: { text: { fill: "#c6c6c6" } },
            legend: { text: { fill: "#c6c6c6" } },
          },
          grid: { line: { stroke: "#ffffff1a" } },
          tooltip: { container: { background: "#111217", color: "#eaeaea" } },
        }}
        enableLabel={false}
        axisBottom={{ tickRotation: -30 }}
        axisLeft={{ format: (v) => `${v}${unit}` }}
        animate
        motionConfig="gentle"
      />
    </div>
  );
}
