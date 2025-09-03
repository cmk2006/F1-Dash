"use client";
import { Card } from "@/components/ui/Card";
import { useScheduleQuery } from "@/hooks/queries/schedule";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SchedulePage() {
  const search = useSearchParams();
  const router = useRouter();
  const [season, setSeason] = useState<number>(Number(search.get("season")) || new Date().getFullYear());
  const seasons = useMemo(() => Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => 1950 + i).reverse(), []);
  const { data, isLoading, error } = useScheduleQuery(season);
  const now = new Date().toISOString().slice(0, 10);
  const past = (data?.races ?? []).filter((r) => r.date <= now);
  const future = (data?.races ?? []).filter((r) => r.date > now);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Schedule</h1>
        <select className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" value={season} onChange={(e) => setSeason(Number(e.target.value))}>
          {seasons.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="hidden">{/* sync URL */}
        {/* The effect below updates the URL when season changes */}
      </div>
      <EffectSync season={season} />
      {isLoading ? (
        <div className="h-24 skeleton" />
      ) : error ? (
        <div className="text-red-400 text-sm">Failed to load schedule</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title={`Completed / Live (${past.length})`}>
            <ul className="divide-y divide-gray-800">
              {past.map((r) => (
                <li key={r.round} className="py-2 flex items-center justify-between">
                  <Link href={{ pathname: "/results", query: { season: r.season, round: r.round } }} className="flex-1">
                    <div className="text-sm font-medium">Rd {r.round} • {r.name}</div>
                    <div className="text-xs text-gray-400">{r.circuit} — {r.location}</div>
                  </Link>
                  <div className="text-right text-xs text-gray-400">
                    <div>{r.date}</div>
                    {r.time && <div>{r.time}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card title={`Upcoming (${future.length})`}>
            <ul className="divide-y divide-gray-800">
              {future.map((r) => (
                <li key={r.round} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Rd {r.round} • {r.name}</div>
                    <div className="text-xs text-gray-400">{r.circuit} — {r.location}</div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div>{r.date}</div>
                    {r.time && <div>{r.time}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

function EffectSync({ season }: { season: number }) {
  const router = useRouter();
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("season", String(season));
    router.replace(`/schedule?${params.toString()}`);
  }, [season, router]);
  return null;
}
