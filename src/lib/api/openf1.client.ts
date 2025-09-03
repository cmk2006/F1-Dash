const BASE = process.env.NEXT_PUBLIC_OPEN_F1_API_BASE || "https://api.openf1.org";

export type OpenF1Driver = {
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour?: string;
  headshot_url?: string;
};

export async function fetchJson<T>(path: string, qs?: Record<string, any>): Promise<T> {
  const url = new URL(path, BASE);
  if (qs) {
    Object.entries(qs).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  // Live telemetry can exceed Next's 2MB fetch cache limit; disable caching
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`OpenF1 error ${res.status}`);
  return res.json();
}

export async function getLatestRaceSessionKey(): Promise<number | null> {
  type Session = { session_key: number; session_type: string; date_start: string; date_end: string };
  const sessions = await fetchJson<Session[]>("/v1/sessions", { session_type: "Race", year: new Date().getFullYear() });
  const now = Date.now();
  const sorted = sessions
    .filter((s) => new Date(s.date_start).getTime() <= now)
    .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
  return sorted[0]?.session_key ?? null;
}

export async function getDrivers(session_key: number): Promise<OpenF1Driver[]> {
  return fetchJson<OpenF1Driver[]>("/v1/drivers", { session_key });
}

export type OpenF1Position = { driver_number: number; position: number; date: string };
export async function getPositions(session_key: number): Promise<OpenF1Position[]> {
  // Pull latest snapshot of positions for the session
  return fetchJson<OpenF1Position[]>("/v1/position", { session_key });
}

export type OpenF1Interval = { driver_number: number; gap_to_leader: number | string | null; interval: number | string | null; date: string };
export async function getIntervals(session_key: number): Promise<OpenF1Interval[]> {
  return fetchJson<OpenF1Interval[]>("/v1/intervals", { session_key });
}

export type OpenF1Lap = { driver_number: number; lap_number: number; lap_duration: number | null; date_start: string };
export async function getLaps(session_key: number): Promise<OpenF1Lap[]> {
  return fetchJson<OpenF1Lap[]>("/v1/laps", { session_key });
}

export type OpenF1Pit = { driver_number: number; lap_number: number; date: string };
export async function getPits(session_key: number): Promise<OpenF1Pit[]> {
  return fetchJson<OpenF1Pit[]>("/v1/pit", { session_key });
}

export type OpenF1Grid = { driver_number: number; position: number };
export async function getStartingGrid(session_key: number): Promise<OpenF1Grid[]> {
  return fetchJson<OpenF1Grid[]>("/v1/starting_grid", { session_key });
}

export type OpenF1Session = {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  circuit_short_name?: string;
  country_name?: string;
};
export async function getSessions(params: { year?: number; session_type?: string } = {}): Promise<OpenF1Session[]> {
  const { year = new Date().getFullYear(), session_type } = params;
  return fetchJson<OpenF1Session[]>("/v1/sessions", { year, ...(session_type ? { session_type } : {}) });
}

export type OpenF1Weather = {
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  rainfall: number;
  date: string;
  session_key: number;
  meeting_key: number;
};
export async function getWeather(session_key: number): Promise<OpenF1Weather[]> {
  return fetchJson<OpenF1Weather[]>("/v1/weather", { session_key });
}
