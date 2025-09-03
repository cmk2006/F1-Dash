"use client";
import { useStandingsQuery, useConstructorStandingsQuery } from "@/hooks/queries/standings";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Table } from "@/components/ui/Table";
import { DriverAvatar, TeamLogo } from "@/components/ui/Avatar";

export default function StandingsPage() {
  const { data, isLoading, error } = useStandingsQuery();
  const { data: cons, isLoading: cl, error: ce } = useConstructorStandingsQuery();

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Standings</h1>
        <Link href="/results" className="text-sm text-f1-red hover:underline">Latest Results →</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title={`Driver Standings ${data?.season ?? ""}`}>
          {isLoading ? (
            <div className="h-24 skeleton" />
          ) : error ? (
            <div className="text-red-400 text-sm">Failed to load</div>
          ) : (
            <Table
              columns={[
                { key: "position", header: "#" },
                { key: "driver", header: "Driver", render: (r) => (
                  <div className="flex items-center gap-2"><DriverAvatar name={r.driver} size={18} /><span>{r.driver}</span></div>
                ) },
                { key: "constructor", header: "Team", render: (r) => (
                  <div className="flex items-center gap-2"><TeamLogo name={r.constructor} size={16} /><span>{r.constructor}</span></div>
                ) },
                { key: "points", header: "Pts" },
                { key: "wins", header: "Wins" },
              ]}
              data={data!.drivers}
            />
          )}
        </Card>
        <Card title={`Constructor Standings ${cons?.season ?? ""}`}>
          {cl ? (
            <div className="h-24 skeleton" />
          ) : ce ? (
            <div className="text-red-400 text-sm">Failed to load</div>
          ) : (
            <Table
              columns={[
                { key: "position", header: "#" },
                { key: "constructor", header: "Constructor", render: (r) => (
                  <div className="flex items-center gap-2"><TeamLogo name={r.constructor} size={18} /><span>{r.constructor}</span></div>
                ) },
                { key: "points", header: "Pts" },
                { key: "wins", header: "Wins" },
              ]}
              data={cons?.constructors ?? []}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
