"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { DriverAvatar, TeamLogo } from "@/components/ui/Avatar";
import { useRaceResults, useScheduleQuery } from "@/hooks/queries/schedule";
import { useRouter, useSearchParams } from "next/navigation";

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function ResultsPage() {
  const search = useSearchParams();
  const router = useRouter();
  const initialSeason = Number(search.get("season")) || new Date().getFullYear();
  const [season, setSeason] = useState<number>(initialSeason);
  const { data: sched } = useScheduleQuery(season);
  const completedRounds = useMemo(() => (sched?.races ?? []).filter((r) => r.status === "Completed/Live").map((r) => r.round), [sched]);
  const lastCompleted = useMemo(() => (completedRounds.length ? Math.max(...completedRounds) : 1), [completedRounds]);
  const initialRound = Number(search.get("round")) || lastCompleted || 1;
  const [round, setRound] = useState<number>(initialRound);
  const { data, isLoading, error } = useRaceResults(String(season), round);
  const qpView = (search.get("view") ?? "Race").toLowerCase();
  const initialView = ((): "Race" | "Sprint" | "Qualifying" | "Sprint Qualifying" => {
    switch (qpView) {
      case "sprint":
        return "Sprint";
      case "qualifying":
        return "Qualifying";
      case "sprint%20qualifying":
      case "sprint-qualifying":
      case "sprint_qualifying":
      case "sprintqualifying":
        return "Sprint Qualifying";
      default:
        return "Race";
    }
  })();
  const [view, setView] = useState<"Race" | "Sprint" | "Qualifying" | "Sprint Qualifying">(initialView);

  const rounds = useMemo(() => {
    const total = (sched?.races ?? []).length || 25;
    return range(1, total);
  }, [sched]);
  const seasons = useMemo(() => range(1950, new Date().getFullYear()), []);

  useEffect(() => {
    const nextRound = (sched?.races ?? []).filter((r) => r.status === "Completed/Live").slice(-1)[0]?.round || 1;
    setRound(nextRound);
  }, [season, sched]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("season", String(season));
    params.set("round", String(round));
    params.set("view", view.toLowerCase().replace(/\s+/g, "-"));
    router.replace(`/results?${params.toString()}`);
  }, [season, round, view, router]);

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Results</h1>
  <Card title="Select">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm">Season</label>
          <select className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" value={season} onChange={(e) => setSeason(Number(e.target.value))}>
            {seasons.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <label className="text-sm">Round</label>
          <select className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" value={round} onChange={(e) => setRound(Number(e.target.value))}>
            {rounds.map((r) => (
              <option key={r} value={r}>Rd {r}</option>
            ))}
          </select>
          <div className="ml-auto flex gap-2">
            {(["Race", "Sprint", "Qualifying", "Sprint Qualifying"] as const).map((v) => (
              <button
                key={v}
                className={`px-2 py-1 text-sm rounded border ${view === v ? "border-f1-red text-white" : "border-gray-700 text-gray-300"}`}
                onClick={() => setView(v)}
              >{v}</button>
            ))}
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={data ? `${data.raceName} (${data.season} • Rd ${data.round})` : `${view} Results`}>
          {isLoading ? (
            <div className="h-24 skeleton" />
          ) : error ? (
            <div className="text-red-400 text-sm">Failed to load</div>
          ) : data ? (
            view === "Race" ? (
              <Table
                columns={[
                  { key: "position", header: "#" },
                  { key: "driver", header: "Driver", render: (r) => (
                    <div className="flex items-center gap-2"><DriverAvatar name={r.driver} number={r.driverNumber ?? undefined} size={18} /><span>{r.driver}</span></div>
                  ) },
                  { key: "constructor", header: "Team", render: (r) => (
                    <div className="flex items-center gap-2"><TeamLogo name={r.constructor} size={16} /><span>{r.constructor}</span></div>
                  ) },
                  { key: "grid", header: "Grid" },
                  { key: "laps", header: "Laps" },
                  { key: "time", header: "Time" },
                  { key: "points", header: "Pts" },
                  { key: "status", header: "Status" },
                ]}
                data={data.results}
              />
            ) : view === "Sprint" ? (
              data.sprint ? (
                <Table
                  columns={[
                    { key: "position", header: "#" },
                    { key: "driver", header: "Driver", render: (r) => (
                      <div className="flex items-center gap-2"><DriverAvatar name={r.driver} number={r.driverNumber ?? undefined} size={18} /><span>{r.driver}</span></div>
                    ) },
                    { key: "constructor", header: "Team", render: (r) => (
                      <div className="flex items-center gap-2"><TeamLogo name={r.constructor} size={16} /><span>{r.constructor}</span></div>
                    ) },
                    { key: "laps", header: "Laps" },
                    { key: "time", header: "Time" },
                    { key: "points", header: "Pts" },
                    { key: "status", header: "Status" },
                  ]}
                  data={data.sprint.results}
                />
              ) : (
                <div className="text-sm text-gray-400">No sprint this round</div>
              )
            ) : view === "Sprint Qualifying" ? (
              data.sprintQualifying ? (
                <Table
                  columns={[
                    { key: "position", header: "#" },
                    { key: "driver", header: "Driver", render: (r) => (
                      <div className="flex items-center gap-2"><DriverAvatar name={r.driver} number={r.driverNumber ?? undefined} size={18} /><span>{r.driver}</span></div>
                    ) },
                    { key: "constructor", header: "Team", render: (r) => (
                      <div className="flex items-center gap-2"><TeamLogo name={r.constructor} size={16} /><span>{r.constructor}</span></div>
                    ) },
                    { key: "sq1", header: "SQ1" },
                    { key: "sq2", header: "SQ2" },
                    { key: "sq3", header: "SQ3" },
                  ]}
                  data={data.sprintQualifying.results}
                />
              ) : (
                <div className="text-sm text-gray-400">No sprint qualifying data</div>
              )
            ) : (
              data.qualifying ? (
                <Table
                  columns={[
                    { key: "position", header: "#" },
                    { key: "driver", header: "Driver", render: (r) => (
                      <div className="flex items-center gap-2"><DriverAvatar name={r.driver} number={r.driverNumber ?? undefined} size={18} /><span>{r.driver}</span></div>
                    ) },
                    { key: "constructor", header: "Team", render: (r) => (
                      <div className="flex items-center gap-2"><TeamLogo name={r.constructor} size={16} /><span>{r.constructor}</span></div>
                    ) },
                    { key: "q1", header: "Q1" },
                    { key: "q2", header: "Q2" },
                    { key: "q3", header: "Q3" },
                  ]}
                  data={data.qualifying.results}
                />
              ) : (
                <div className="text-sm text-gray-400">No qualifying data</div>
              )
            )
          ) : null}
        </Card>
        {/* Secondary card intentionally removed; main card switches views */}
      </div>
    </div>
  );
}
