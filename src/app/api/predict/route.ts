import { NextRequest, NextResponse } from "next/server";
import { getDrivers, getIntervals, getLaps, getLatestRaceSessionKey, getPits, getPositions } from "@/lib/api/openf1.client";
import { spawn } from "child_process";
import { serverCache } from "@/lib/server/cache";

async function runPythonPredictor(input: any): Promise<{ winner_driver_number: number; probability: number } | null> {
  const script = process.env.PREDICTOR_PY_PATH; // e.g. scripts/predictor.py
  if (!script) return null;
  return new Promise((resolve) => {
    try {
      const proc = spawn("python3", [script], { stdio: ["pipe", "pipe", "pipe"] });
      const timer = setTimeout(() => {
        proc.kill("SIGKILL");
        resolve(null);
      }, 5000);
      let out = "";
      proc.stdout.on("data", (d) => (out += d.toString()));
      proc.stderr.on("data", () => {});
      proc.on("close", () => {
        clearTimeout(timer);
        try {
          const parsed = JSON.parse(out);
          if (typeof parsed?.winner_driver_number === "number" && typeof parsed?.probability === "number") {
            resolve({ winner_driver_number: parsed.winner_driver_number, probability: parsed.probability });
          } else resolve(null);
        } catch {
          resolve(null);
        }
      });
      proc.stdin.write(JSON.stringify(input));
      proc.stdin.end();
    } catch {
      resolve(null);
    }
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionParam = searchParams.get("session_key");
  const session_key = sessionParam ? Number(sessionParam) : await getLatestRaceSessionKey();
  if (!session_key) return NextResponse.json({ error: "No session" }, { status: 200 });

  const cacheKey = `predict:${session_key}`;
  const data = await serverCache.getOrSet(cacheKey, 30_000, async () => {
    const [drivers, positions, intervals, laps, pits] = await Promise.all([
      getDrivers(session_key),
      getPositions(session_key),
      getIntervals(session_key).catch(() => []),
      getLaps(session_key).catch(() => []),
      getPits(session_key).catch(() => []),
    ] as const);

  // Build latest snapshot
  const latestPos = new Map<number, { position: number; date: string }>();
  for (const p of positions) {
    const prev = latestPos.get(p.driver_number);
    if (!prev || new Date(p.date).getTime() > new Date(prev.date).getTime()) latestPos.set(p.driver_number, { position: p.position, date: p.date });
  }
  const latestInt = new Map<number, { gap_to_leader: any; interval: any; date: string }>();
  for (const i of intervals as any[]) {
    const prev = latestInt.get(i.driver_number);
    if (!prev || new Date(i.date).getTime() > new Date(prev.date).getTime()) latestInt.set(i.driver_number, { gap_to_leader: i.gap_to_leader, interval: i.interval, date: i.date });
  }
  const lastLap = new Map<number, { lap_number: number }>();
  for (const l of laps) {
    const prev = lastLap.get(l.driver_number);
    if (!prev || l.lap_number > prev.lap_number) lastLap.set(l.driver_number, { lap_number: l.lap_number });
  }
  const pitCount = new Map<number, number>();
  for (const p of pits) pitCount.set(p.driver_number, (pitCount.get(p.driver_number) ?? 0) + 1);

    const snapshot = drivers
    .map((d) => ({
      driver_number: d.driver_number,
      driver: d.full_name,
      team: d.team_name,
      position: latestPos.get(d.driver_number)?.position ?? 99,
      gap_to_leader: latestInt.get(d.driver_number)?.gap_to_leader ?? null,
      lap_number: lastLap.get(d.driver_number)?.lap_number ?? 0,
      pits: pitCount.get(d.driver_number) ?? 0,
    }))
    .filter((x) => x.position !== 99)
    .sort((a, b) => a.position - b.position);
    // Try python predictor first
    const py = await runPythonPredictor({ session_key, snapshot });
    let winner_driver_number: number | null = null;
    let probability = 0;
    let source: "python" | "heuristic" = "heuristic";
    if (py) {
      winner_driver_number = py.winner_driver_number;
      probability = Math.max(0.5, Math.min(py.probability, 0.99));
      source = "python";
    } else {
      // Heuristic: current leader adjusted by gap, laps elapsed, and pit delta
      const leader = snapshot[0];
      const p2 = snapshot[1];
      if (!leader) return { session_key, source: "heuristic", prediction: null, updated_at: new Date().toISOString() } as any;
      winner_driver_number = leader.driver_number;
      let base = 0.6;
      // parse gap to leader for P2
      let gap = 0;
      const g = p2?.gap_to_leader;
      if (typeof g === "number") gap = g;
      else if (typeof g === "string") {
        const m = g.match(/([\d\.]+)/);
        if (m) gap = parseFloat(m[1]);
        if (/LAP/i.test(g)) gap = 25; // one lap ~ large gap
      }
      if (gap >= 5) base += 0.15;
      else if (gap >= 2) base += 0.08;
      else if (gap >= 1) base += 0.04;

      const maxLap = snapshot.reduce((m, x) => Math.max(m, x.lap_number), 0);
      if (maxLap >= 45) base += 0.12;
      else if (maxLap >= 30) base += 0.07;
      else if (maxLap >= 15) base += 0.03;

      const pitAvg = snapshot.reduce((s, x) => s + x.pits, 0) / Math.max(1, snapshot.length);
      const leaderPitDelta = leader.pits - pitAvg;
      if (leaderPitDelta > 0.5) base -= 0.08;
      if (leaderPitDelta > 1.0) base -= 0.12;

      probability = Math.max(0.5, Math.min(0.95, base));
    }

    const winner = drivers.find((d) => d.driver_number === winner_driver_number) || null;
    return {
      session_key,
      source,
      prediction: winner
        ? { winner_driver_number, driver: winner.full_name, team: winner.team_name, probability }
        : null,
      updated_at: new Date().toISOString(),
    };
  });

  return NextResponse.json(data);
}
