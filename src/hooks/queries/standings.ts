"use client";
import { useQuery } from "@tanstack/react-query";

type DriverStanding = {
  position: number;
  driver: string;
  constructor: string;
  points: number;
  wins: number;
};

type StandingsResponse = {
  season: number;
  drivers: DriverStanding[];
};

export function useStandingsQuery() {
  return useQuery<StandingsResponse>({
    queryKey: ["standings"],
    queryFn: async () => {
      const res = await fetch("/api/standings");
      if (!res.ok) throw new Error("Failed to load standings");
      return res.json();
    },
    staleTime: 60_000,
  });
}

type ConstructorStanding = {
  position: number;
  constructor: string;
  points: number;
  wins: number;
};

type ConstructorStandingsResponse = {
  season: number;
  constructors: ConstructorStanding[];
};

export function useConstructorStandingsQuery() {
  return useQuery<ConstructorStandingsResponse>({
    queryKey: ["constructor-standings"],
    queryFn: async () => {
      const res = await fetch("/api/constructor-standings");
      if (!res.ok) throw new Error("Failed to load constructor standings");
      return res.json();
    },
    staleTime: 60_000,
  });
}
