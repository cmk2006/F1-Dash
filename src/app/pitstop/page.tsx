"use client";
import { usePitStopsQuery } from "@/hooks/queries/pitstops";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { BarChart } from "@/components/ui/BarChart";

function ms(ms: number) {
  return `${(ms / 1000).toFixed(3)}s`;
}

export default function PitStopPage() {
  const { data, isLoading, error } = usePitStopsQuery();

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Pit Stop Insights</h1>
      <Card title="Fastest Pit Stops">
        {isLoading ? (
          <div className="h-24 skeleton" />
        ) : error ? (
          <div className="text-red-400 text-sm">Failed to load</div>
        ) : (
          <Table
            columns={[
              { key: "race", header: "Race" },
              { key: "driver", header: "Driver" },
              { key: "constructor", header: "Team" },
              { key: "timeMs", header: "Time", render: (r) => ms(r.timeMs) },
            ]}
            data={data!.fastest}
          />
        )}
      </Card>
      <Card title="Average Pit Stop by Team">
        {isLoading ? (
          <div className="h-24 skeleton" />
        ) : error ? (
          <div className="text-red-400 text-sm">Failed to load</div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            <Table
              columns={[
                { key: "constructor", header: "Team" },
                { key: "avgMs", header: "Average", render: (r) => ms(r.avgMs) },
              ]}
              data={data!.averages}
            />
            <BarChart
              data={data!.averages.map((a) => ({ label: a.constructor, value: Number((a.avgMs / 1000).toFixed(3)) }))}
              unit="s"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
