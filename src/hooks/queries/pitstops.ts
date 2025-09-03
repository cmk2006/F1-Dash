"use client";
import { useQuery } from "@tanstack/react-query";

type FastestStop = {
  driver: string;
  constructor: string;
  timeMs: number;
  race: string;
};

type AvgByConstructor = {
  constructor: string;
  avgMs: number;
};

type PitStopsResponse = {
  fastest: FastestStop[];
  averages: AvgByConstructor[];
};

export function usePitStopsQuery() {
  return useQuery<PitStopsResponse>({
    queryKey: ["pitstops"],
    queryFn: async () => {
      const res = await fetch("/api/pitstops");
      if (!res.ok) throw new Error("Failed to load pit stops");
      return res.json();
    },
    staleTime: 60_000,
  });
}
