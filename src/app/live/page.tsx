"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { useLiveLeaderboard } from "@/hooks/queries/live";
import type { LiveRow } from "@/hooks/queries/live";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { DriverAvatar, TeamLogo } from "@/components/ui/Avatar";
import { getSessions, getWeather, OpenF1Session, OpenF1Weather } from "@/lib/api/openf1.client";

export default function LivePage() {
  const [currentSession, setCurrentSession] = useState<OpenF1Session | null>(null);
  const session_key = currentSession?.session_key;
  const { data, isLoading, error } = useLiveLeaderboard(session_key);
  const prevPositions = useRef<Map<number, number>>(new Map());

  const rowsWithChange = useMemo(() => {
    const rows = data?.rows ?? [];
    const decorated = rows.map((r) => {
      const prev = prevPositions.current.get(r.driver_number);
      const delta = prev ? prev - r.position : 0;
      return { ...r, __delta: delta } as any;
    });
    // Update ref after computing deltas
    prevPositions.current = new Map(rows.map((r) => [r.driver_number, r.position]));
    return decorated as (typeof rows[0] & { __delta?: number })[];
  }, [data]);
  const [weather, setWeather] = useState<OpenF1Weather | null>(null);

  useEffect(() => {
    (async () => {
      // Collect sessions across common types and pick the current or most recent.
      const typeGroups: string[][] = [
        ["Race"],
        ["Sprint"],
        ["Sprint Qualifying", "Sprint Shootout"],
        ["Qualifying"],
        ["Practice 3", "FP3", "Free Practice 3"],
        ["Practice 2", "FP2", "Free Practice 2"],
        ["Practice 1", "FP1", "Free Practice 1"],
      ];
      const lists: OpenF1Session[][] = [];
      for (const group of typeGroups) {
        const results = await Promise.all(
          group.map((g) => getSessions({ session_type: g }).catch(() => [] as OpenF1Session[]))
        );
        lists.push(results.flat());
      }
      const all = lists.flat();
      if (all.length === 0) {
        setCurrentSession(null);
        return;
      }
      const now = Date.now();
      const ongoing = all.filter((s) => new Date(s.date_start).getTime() <= now && now <= new Date(s.date_end).getTime());
      const chosen = (ongoing.length > 0 ? ongoing : all).sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];
      setCurrentSession(chosen);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!session_key) return setWeather(null);
      const w = await getWeather(session_key).catch(() => [] as OpenF1Weather[]);
      if (w.length > 0) {
        const latest = w.reduce((acc, cur) => (new Date(cur.date).getTime() > new Date(acc.date).getTime() ? cur : acc), w[0]);
        setWeather(latest);
      } else setWeather(null);
    })();
  }, [session_key]);
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Live Leaderboard</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Session">
          {!currentSession ? (
            <div className="text-sm text-gray-400">No session found</div>
          ) : (
            <div className="text-sm">
              <div className="font-medium">{currentSession.session_type}: {currentSession.circuit_short_name || currentSession.session_name}</div>
              <div className="text-xs text-gray-400 mt-1">{new Date(currentSession.date_start).toLocaleString()} - {new Date(currentSession.date_end).toLocaleString()}</div>
            </div>
          )}
        </Card>
        <Card title="Weather (latest)">
          {!weather ? (
            <div className="text-sm text-gray-400">No weather data</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Air: <span className="text-gray-300">{weather.air_temperature.toFixed(1)}°C</span></div>
              <div>Track: <span className="text-gray-300">{weather.track_temperature.toFixed(1)}°C</span></div>
              <div>Humidity: <span className="text-gray-300">{weather.humidity}%</span></div>
              <div>Wind: <span className="text-gray-300">{weather.wind_speed.toFixed(1)} m/s @ {weather.wind_direction}°</span></div>
              <div>Rain: <span className="text-gray-300">{weather.rainfall ? "Yes" : "No"}</span></div>
              <div className="text-xs text-gray-400">{new Date(weather.date).toLocaleTimeString()}</div>
            </div>
          )}
        </Card>
        {(currentSession && isRaceLike(currentSession.session_type)) ? (
          <Card title="Prediction">
            <PredictionPanel sessionKey={session_key ?? undefined} />
          </Card>
        ) : null}
      </div>
      <Card title={currentSession ? `${currentSession.session_type}: ${currentSession.circuit_short_name || currentSession.session_name}` : "No live session detected"}>
        {isLoading ? (
          <div className="h-24 skeleton" />
        ) : error ? (
          <div className="text-red-400 text-sm">Failed to load live data</div>
        ) : (
          <Table
            columns={buildColumns(currentSession?.session_type)}
            data={rowsWithChange as any}
            rowKey={(r: any) => r.driver_number}
            rowClassName={(r: any) => (r.__delta ?? 0) > 0 ? "pos-up" : (r.__delta ?? 0) < 0 ? "pos-down" : undefined}
          />
        )}
      </Card>
    </div>
  );
}

function PredictionPanel({ sessionKey }: { sessionKey?: number }) {
  const [pred, setPred] = useState<{ driver: string; team: string; probability: number } | null>(null);
  const [source, setSource] = useState<string>("");
  const [ts, setTs] = useState<string>("");
  useEffect(() => {
    let timer: any;
    async function load() {
      if (!sessionKey) return setPred(null);
      const res = await fetch(`/api/predict?session_key=${sessionKey}`);
      if (!res.ok) return;
      const json = await res.json();
      setSource(json.source || "heuristic");
      setPred(json.prediction);
      setTs(json.updated_at);
    }
    load();
    if (sessionKey) timer = setInterval(load, 30000);
    return () => timer && clearInterval(timer);
  }, [sessionKey]);
  if (!sessionKey) return <div className="text-sm text-gray-400">No active session</div>;
  if (!pred) return <div className="text-sm text-gray-400">Calculating...</div>;
  return (
    <div className="text-sm">
      <div className="font-medium">Likeliest winner</div>
      <div className="mt-1">{pred.driver} <span className="text-gray-400">({pred.team})</span></div>
      <div className="mt-1">Probability: <span className="text-gray-300">{(pred.probability * 100).toFixed(1)}%</span></div>
      <div className="mt-1 text-xs text-gray-500">Source: {source} • {ts && new Date(ts).toLocaleTimeString()}</div>
    </div>
  );
}

function normalizeType(t?: string): "race" | "sprint" | "sprint_qualifying" | "qualifying" | "practice" {
  const s = (t || "").toLowerCase();
  if (s.includes("race")) return "race";
  if (s.includes("sprint") && s.includes("qual")) return "sprint_qualifying";
  if (s.includes("sprint")) return "sprint";
  if (s.includes("qual")) return "qualifying";
  if (s.includes("practice") || s === "fp1" || s === "fp2" || s === "fp3") return "practice";
  return "race";
}

function isRaceLike(t?: string) {
  const n = normalizeType(t);
  return n === "race" || n === "sprint";
}

function buildColumns(t?: string): { key: keyof LiveRow; header: string; render?: (row: LiveRow) => React.ReactNode }[] {
  const n = normalizeType(t);
  if (n === "qualifying" || n === "sprint_qualifying") {
    return [
      { key: "position", header: "#", align: "right", width: 48 } as any,
      { key: "driver", header: "Driver", render: (r) => (
        <div className="flex items-center gap-2"><DriverAvatar name={r.driver} size={18} /><span>{r.driver}</span></div>
      ) },
      { key: "team", header: "Team", render: (r) => (
        <div className="flex items-center gap-2"><TeamLogo name={r.team} size={16} /><span>{r.team}</span></div>
      ) },
      { key: "driver_number", header: "#No", align: "right", width: 64 } as any,
      { key: "best_lap", header: "Best" },
      { key: "last_lap", header: "Last" },
      { key: "laps", header: "Laps", align: "right", width: 64 } as any,
    ];
  }
  if (n === "practice") {
    return [
      { key: "driver", header: "Driver", render: (r) => (
        <div className="flex items-center gap-2"><DriverAvatar name={r.driver} size={18} /><span>{r.driver}</span></div>
      ) },
      { key: "team", header: "Team", render: (r) => (
        <div className="flex items-center gap-2"><TeamLogo name={r.team} size={16} /><span>{r.team}</span></div>
      ) },
      { key: "driver_number", header: "#No", align: "right", width: 64 } as any,
      { key: "best_lap", header: "Best" },
      { key: "last_lap", header: "Last" },
      { key: "laps", header: "Laps", align: "right", width: 64 } as any,
    ];
  }
  // race/sprint default
  return [
    { key: "position", header: "#", align: "right", width: 48 } as any,
    { key: "driver", header: "Driver", render: (r: LiveRow) => (
      <div className="flex items-center gap-2"><DriverAvatar name={r.driver} number={r.driver_number} size={18} /><span>{r.driver}</span></div>
    ) },
    { key: "team", header: "Team", render: (r: LiveRow) => (
      <div className="flex items-center gap-2"><TeamLogo name={r.team} size={16} /><span>{r.team}</span></div>
    ) },
    { key: "driver_number", header: "#No", align: "right", width: 64 } as any,
    { key: "gap_to_leader", header: "+Leader", align: "right" } as any,
    { key: "interval", header: "+Ahead", align: "right" } as any,
    { key: "laps", header: "Laps", align: "right", width: 64 } as any,
    { key: "pits", header: "Pits", align: "right", width: 56 } as any,
    { key: "last_lap", header: "Last", align: "right" } as any,
    { key: "best_lap", header: "Best", align: "right" } as any,
    { key: "grid", header: "Grid", align: "right", width: 64 } as any,
  ];
}
