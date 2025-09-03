import { NextResponse } from "next/server";

type JolpiSchedule = {
  MRData: {
    RaceTable: {
      season: string;
      Races: Array<{
        season: string;
        round: string;
        raceName: string;
        Circuit: { circuitName: string; Location: { locality: string; country: string } };
        date: string;
        time?: string;
      }>;
    };
  };
};

export async function GET(_: Request, { params }: { params: { season: string } }) {
  const { season } = params;
  const res = await fetch(`https://api.jolpi.ca/ergast/f1/${season}.json`, { next: { revalidate: 300 } });
  if (!res.ok) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  const json = (await res.json()) as JolpiSchedule;
  const now = new Date();
  const items = json.MRData.RaceTable.Races.map((r) => {
    const start = new Date(`${r.date}T${r.time ?? "00:00:00Z"}`);
    const status = start < now ? "Completed/Live" : "Upcoming";
    return {
      season: r.season,
      round: Number(r.round),
      name: r.raceName,
      circuit: r.Circuit.circuitName,
      location: `${r.Circuit.Location.locality}, ${r.Circuit.Location.country}`,
      date: r.date,
      time: r.time ?? null,
      status,
    };
  });
  return NextResponse.json({ season: json.MRData.RaceTable.season, races: items });
}
