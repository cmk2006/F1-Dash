"use client";
import { useQuery } from "@tanstack/react-query";
import { getDrivers, getIntervals, getLatestRaceSessionKey, getPits, getPositions, getStartingGrid, OpenF1Driver, getLaps } from "@/lib/api/openf1.client";

export type LiveRow = {
  position: number;
  driver_number: number;
  driver: string;
  team: string;
  gap_to_leader?: string;
  interval?: string;
  last_lap?: string;
  best_lap?: string;
  laps?: number;
  pits?: number;
  grid?: number;
};

async function fetchLive(sessionKey?: number): Promise<{ rows: LiveRow[]; session_key: number | null }> {
  const session_key = sessionKey ?? (await getLatestRaceSessionKey());
  if (!session_key) return { rows: [], session_key: null };
  const [drivers, positions, intervals, laps, pits, grid] = await Promise.all([
    getDrivers(session_key),
    getPositions(session_key),
    getIntervals(session_key).catch(() => []),
    getLaps(session_key).catch(() => []),
    getPits(session_key).catch(() => []),
    getStartingGrid(session_key).catch(() => []),
  ] as const);
  // Collapse positions to latest per driver
  const latestByDriver = new Map<number, { position: number; date: string }>();
  for (const p of positions) {
    const prev = latestByDriver.get(p.driver_number);
    if (!prev || new Date(p.date).getTime() > new Date(prev.date).getTime()) {
      latestByDriver.set(p.driver_number, { position: p.position, date: p.date });
    }
  }
  // latest interval per driver
  const latestInterval = new Map<number, { gap_to_leader: any; interval: any; date: string }>();
  for (const i of intervals as any[]) {
    const prev = latestInterval.get(i.driver_number);
    if (!prev || new Date(i.date).getTime() > new Date(prev.date).getTime()) {
      latestInterval.set(i.driver_number, { gap_to_leader: i.gap_to_leader, interval: i.interval, date: i.date });
    }
  }

  // last lap and best lap per driver
  const lastLap = new Map<number, { lap_number: number; lap_duration: number | null }>();
  const bestLap = new Map<number, number>();
  for (const l of laps) {
    const prev = lastLap.get(l.driver_number);
    if (!prev || l.lap_number > prev.lap_number) lastLap.set(l.driver_number, { lap_number: l.lap_number, lap_duration: l.lap_duration });
    if (typeof l.lap_duration === "number") {
      const best = bestLap.get(l.driver_number);
      if (best === undefined || l.lap_duration < best) bestLap.set(l.driver_number, l.lap_duration);
    }
  }

  // pit counts
  const pitCount = new Map<number, number>();
  for (const p of pits) {
    pitCount.set(p.driver_number, (pitCount.get(p.driver_number) ?? 0) + 1);
  }

  // starting grid
  const gridMap = new Map<number, number>();
  for (const g of grid) gridMap.set(g.driver_number, g.position);

  const rows: LiveRow[] = drivers
    .map((d: OpenF1Driver) => ({
      driver_number: d.driver_number,
      driver: d.name_acronym || d.full_name,
      team: d.team_name,
      position: latestByDriver.get(d.driver_number)?.position ?? 99,
      gap_to_leader: fmtGap(latestInterval.get(d.driver_number)?.gap_to_leader),
      interval: fmtGap(latestInterval.get(d.driver_number)?.interval),
      last_lap: fmtLap(lastLap.get(d.driver_number)?.lap_duration),
      best_lap: fmtLap(bestLap.get(d.driver_number)),
      laps: lastLap.get(d.driver_number)?.lap_number,
      pits: pitCount.get(d.driver_number) ?? 0,
      grid: gridMap.get(d.driver_number),
    }))
    .sort((a, b) => a.position - b.position)
    .filter((r) => r.position !== 99);
  return { rows, session_key };
}

export function useLiveLeaderboard(sessionKey?: number) {
  return useQuery({
  queryKey: ["live-leaderboard", sessionKey ?? "latest"],
  queryFn: () => fetchLive(sessionKey),
    refetchInterval: 5000,
  });
}

function fmtGap(v: any): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return "+" + v.toFixed(3);
  if (typeof v === "string") return v; // may be "+1 LAP"
  return undefined;
}

function fmtLap(v: number | null | undefined): string | undefined {
  if (v === null || v === undefined) return undefined;
  // seconds to mm:ss.sss
  const mins = Math.floor(v / 60);
  const secs = v % 60;
  return `${mins}:${secs.toFixed(3).padStart(6, "0")}`;
}
