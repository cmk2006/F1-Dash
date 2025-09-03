import { NextResponse } from "next/server";

type JolpiDriverStandings = {
  MRData: {
    StandingsTable: {
      season: string;
      StandingsLists: Array<{
        DriverStandings: Array<{
          position: string;
          points: string;
          wins: string;
          Driver: { givenName: string; familyName: string; code?: string };
          Constructors: Array<{ name: string }>;
        }>;
      }>;
    };
  };
};

export async function GET() {
  const url = "https://api.jolpi.ca/ergast/f1/current/driverStandings.json";
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  const json = (await res.json()) as JolpiDriverStandings;
  const season = Number(json.MRData.StandingsTable.season);
  const list = json.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
  const drivers = list.map((d) => ({
    position: Number(d.position),
    driver: `${d.Driver.givenName} ${d.Driver.familyName}`,
    constructor: d.Constructors[0]?.name ?? "",
    points: Number(d.points),
    wins: Number(d.wins),
  }));
  return NextResponse.json({ season, drivers });
}
