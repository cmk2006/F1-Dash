import { NextResponse } from "next/server";

type JolpiConstructorStandings = {
  MRData: {
    StandingsTable: {
      season: string;
      StandingsLists: Array<{
        ConstructorStandings: Array<{
          position: string;
          points: string;
          wins: string;
          Constructor: { name: string };
        }>;
      }>;
    };
  };
};

export async function GET() {
  const url = "https://api.jolpi.ca/ergast/f1/current/constructorStandings.json";
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  const json = (await res.json()) as JolpiConstructorStandings;
  const season = Number(json.MRData.StandingsTable.season);
  const list = json.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
  const constructors = list.map((c) => ({
    position: Number(c.position),
    constructor: c.Constructor.name,
    points: Number(c.points),
    wins: Number(c.wins),
  }));
  return NextResponse.json({ season, constructors });
}
