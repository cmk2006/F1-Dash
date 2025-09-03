import { NextResponse } from "next/server";

type JolpiPitStops = {
  MRData: {
    RaceTable: {
      Races: Array<{
        raceName: string;
        PitStops: Array<{ driverId: string; duration: string }>;
      }>;
    };
  };
};

type JolpiResults = {
  MRData: { RaceTable: { Races: Array<{ Results: Array<{ Driver: { driverId: string; code?: string; givenName: string; familyName: string }; Constructor: { name: string } }> }> } };
};

export async function GET() {
  // Fetch pit stops and results for all races in the current season.
  // Note: Jolpica exposes per-race endpoints; we list races from results and fetch each pitstops file.
  const season = new Date().getFullYear();
  const listRes = await fetch(`https://api.jolpi.ca/ergast/f1/${season}/results.json?limit=1000`, { next: { revalidate: 300 } });
  if (!listRes.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  const listJson = (await listRes.json()) as JolpiResults;
  const races = listJson.MRData.RaceTable.Races;

  // For each race, fetch its pitstops and results to map driver meta.
  const perRace = await Promise.all(
    races.map(async (r, idx) => {
      const round = (r as any).round ? Number((r as any).round) : idx + 1; // use round if present
      const [stopsRes, resultsRes] = await Promise.all([
        fetch(`https://api.jolpi.ca/ergast/f1/${season}/${round}/pitstops.json`, { next: { revalidate: 300 } }),
        fetch(`https://api.jolpi.ca/ergast/f1/${season}/${round}/results.json`, { next: { revalidate: 300 } }),
      ]);
      if (!stopsRes.ok || !resultsRes.ok) return null;
      const stopsJson = (await stopsRes.json()) as JolpiPitStops;
      const resultsJson = (await resultsRes.json()) as JolpiResults;
      const race = stopsJson.MRData.RaceTable.Races[0];
      const results = resultsJson.MRData.RaceTable.Races[0]?.Results ?? [];
      if (!race || !(race.PitStops?.length)) return null;
      const byDriver = new Map<string, { driver: string; code?: string; constructor: string }>();
      for (const rr of results) {
        const key = rr.Driver.driverId;
        byDriver.set(key, {
          driver: `${rr.Driver.givenName} ${rr.Driver.familyName}`,
          code: rr.Driver.code,
          constructor: rr.Constructor.name,
        });
      }
      const fastest = (race.PitStops ?? [])
        .map((p) => {
          const meta = byDriver.get(p.driverId);
          const seconds = Number(p.duration);
          return meta
            ? { race: race.raceName ?? `Round ${round}`, driver: meta.code ? `${meta.code}` : meta.driver, constructor: meta.constructor, timeMs: Math.round(seconds * 1000) }
            : null;
        })
        .filter(Boolean) as Array<{ race: string; driver: string; constructor: string; timeMs: number }>;
      if (fastest.length === 0) return null;
      fastest.sort((a, b) => a.timeMs - b.timeMs);
      return fastest[0];
    })
  );

  const fastestPerRace = (perRace.filter(Boolean) as Array<{ race: string; driver: string; constructor: string; timeMs: number }>);

  // Compute averages from the winning pit stops per race
  const agg = new Map<string, { total: number; count: number }>();
  for (const f of fastestPerRace) {
    const a = agg.get(f.constructor) ?? { total: 0, count: 0 };
    a.total += f.timeMs;
    a.count += 1;
    agg.set(f.constructor, a);
  }
  const averages = Array.from(agg.entries()).map(([constructor, { total, count }]) => ({ constructor, avgMs: Math.round(total / count) }));

  return NextResponse.json({ fastest: fastestPerRace, averages });
}
