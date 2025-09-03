"use client";
import { useQuery } from "@tanstack/react-query";

export type ScheduleRace = {
  season: string;
  round: number;
  name: string;
  circuit: string;
  location: string;
  date: string;
  time: string | null;
  status: "Upcoming" | "Completed/Live";
};

export function useScheduleQuery(season?: string | number) {
  const year = season ?? new Date().getFullYear();
  return useQuery<{ season: string; races: ScheduleRace[] }>({
    queryKey: ["schedule", String(year)],
    queryFn: async () => {
      const res = await fetch(`/api/schedule/${year}`);
      if (!res.ok) throw new Error("Failed to load schedule");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export type RaceResults = {
  season: string;
  round: number;
  raceName: string;
  circuit: string;
  date: string;
  time: string | null;
  results: Array<{
    position: number;
    driver: string;
    driverId: string;
  driverNumber?: number | null;
    constructor: string;
    grid: number;
    laps: number;
    status: string;
    points: number;
    time: string | null;
    fastestLap: { rank: number; lap: number; time: string | null; averageSpeed: string | null } | null;
  }>;
  sprint: null | {
    date: string;
    time: string | null;
    results: Array<{
      position: number;
      driver: string;
      driverId: string;
  driverNumber?: number | null;
      constructor: string;
      laps: number;
      status: string;
      points: number;
      time: string | null;
    }>;
  };
  qualifying: null | {
    date: string;
    time: string | null;
    results: Array<{
      position: number;
      driver: string;
      driverId: string;
  driverNumber?: number | null;
      constructor: string;
      q1: string | null;
      q2: string | null;
      q3: string | null;
    }>;
  };
  sprintQualifying: null | {
    date: string;
    time: string | null;
    results: Array<{
      position: number;
      driver: string;
      driverId: string;
  driverNumber?: number | null;
      constructor: string;
      sq1: string | null;
      sq2: string | null;
      sq3: string | null;
    }>;
  };
};

export function useRaceResults(season: string, round: number) {
  return useQuery<RaceResults>({
    queryKey: ["race-results", season, round],
    queryFn: async () => {
      const res = await fetch(`/api/results/${season}/${round}`);
      if (!res.ok) throw new Error("Failed to load results");
      return res.json();
    },
    enabled: Boolean(season && round),
    staleTime: 60 * 60 * 1000,
  });
}
