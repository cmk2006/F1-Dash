import { NextResponse } from "next/server";

// Types for Ergast via Jolpica minimal
type MR = {
  MRData: any;
};

async function j(url: string, revalidate = 600) {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return (await res.json()) as MR;
}

export async function GET(_: Request, { params }: { params: { season: string; round: string } }) {
  const { season, round } = params;

  try {
    // Race
    const race = await j(`https://api.jolpi.ca/ergast/f1/${season}/${round}/results.json`);
    const raceRace = race.MRData?.RaceTable?.Races?.[0];
    const payload: any = {
      season: raceRace?.season ?? season,
      round: Number(raceRace?.round ?? round),
      raceName: raceRace?.raceName ?? "",
      circuit: raceRace?.Circuit?.circuitName ?? "",
      date: raceRace?.date ?? "",
      time: raceRace?.time ?? null,
      results: (raceRace?.Results ?? []).map((r: any) => ({
        position: Number(r.position),
        driver: `${r.Driver?.givenName ?? ""} ${r.Driver?.familyName ?? ""}`.trim(),
        driverId: r.Driver?.driverId ?? "",
        driverNumber: r.Driver?.permanentNumber ? Number(r.Driver.permanentNumber) : null,
        constructor: r.Constructor?.name ?? "",
        grid: Number(r.grid ?? 0),
        laps: Number(r.laps ?? 0),
        status: r.status ?? "",
        points: Number(r.points ?? 0),
        time: r.Time?.time ?? null,
        fastestLap: r.FastestLap
          ? {
              rank: Number(r.FastestLap.rank ?? 0),
              lap: Number(r.FastestLap.lap ?? 0),
              time: r.FastestLap.Time?.time ?? null,
              averageSpeed: r.FastestLap.AverageSpeed ? `${r.FastestLap.AverageSpeed.speed} ${r.FastestLap.AverageSpeed.units}` : null,
            }
          : null,
      })),
      sprint: null,
      qualifying: null,
      sprintQualifying: null,
    };

    // Sprint (if any)
    try {
      const spr = await j(`https://api.jolpi.ca/ergast/f1/${season}/${round}/sprint.json`);
      const sRace = spr.MRData?.RaceTable?.Races?.[0];
      if (sRace?.SprintResults?.length) {
        payload.sprint = {
          date: sRace.date ?? "",
          time: sRace.time ?? null,
          results: sRace.SprintResults.map((r: any) => ({
            position: Number(r.position),
            driver: `${r.Driver?.givenName ?? ""} ${r.Driver?.familyName ?? ""}`.trim(),
            driverId: r.Driver?.driverId ?? "",
            driverNumber: r.Driver?.permanentNumber ? Number(r.Driver.permanentNumber) : null,
            constructor: r.Constructor?.name ?? "",
            laps: Number(r.laps ?? 0),
            status: r.status ?? "",
            points: Number(r.points ?? 0),
            time: r.Time?.time ?? null,
          })),
        };
      }
    } catch {}

    // Qualifying
    try {
      const qual = await j(`https://api.jolpi.ca/ergast/f1/${season}/${round}/qualifying.json`);
      const qRace = qual.MRData?.RaceTable?.Races?.[0];
      if (qRace?.QualifyingResults?.length) {
        payload.qualifying = {
          date: qRace.date ?? "",
          time: qRace.time ?? null,
          results: qRace.QualifyingResults.map((r: any) => ({
            position: Number(r.position),
            driver: `${r.Driver?.givenName ?? ""} ${r.Driver?.familyName ?? ""}`.trim(),
            driverId: r.Driver?.driverId ?? "",
            driverNumber: r.Driver?.permanentNumber ? Number(r.Driver.permanentNumber) : null,
            constructor: r.Constructor?.name ?? "",
            q1: r.Q1 ?? null,
            q2: r.Q2 ?? null,
            q3: r.Q3 ?? null,
          })),
        };
      }
    } catch {}

    // Sprint Qualifying (aka Sprint Shootout) — try multiple endpoints
    try {
      const urls = [
        `https://api.jolpi.ca/ergast/f1/${season}/${round}/sprint-qualifying.json`,
        `https://api.jolpi.ca/ergast/f1/${season}/${round}/sprint_shootout.json`,
        `https://api.jolpi.ca/ergast/f1/${season}/${round}/sprint/shootout.json`,
      ];
      let sq: MR | null = null;
      for (const u of urls) {
        try {
          sq = await j(u);
          if (sq) break;
        } catch {}
      }
      const sqRace = sq?.MRData?.RaceTable?.Races?.[0];
      const list = sqRace?.SprintQualifyingResults || sqRace?.SprintShootoutResults || sqRace?.QualifyingResults;
      if (list?.length) {
        payload.sprintQualifying = {
          date: sqRace.date ?? "",
          time: sqRace.time ?? null,
          results: list.map((r: any) => ({
            position: Number(r.position),
            driver: `${r.Driver?.givenName ?? ""} ${r.Driver?.familyName ?? ""}`.trim(),
            driverId: r.Driver?.driverId ?? "",
            driverNumber: r.Driver?.permanentNumber ? Number(r.Driver.permanentNumber) : null,
            constructor: r.Constructor?.name ?? "",
            sq1: r.SQ1 ?? r.Q1 ?? null,
            sq2: r.SQ2 ?? r.Q2 ?? null,
            sq3: r.SQ3 ?? r.Q3 ?? null,
          })),
        };
      }
    } catch {}

    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
