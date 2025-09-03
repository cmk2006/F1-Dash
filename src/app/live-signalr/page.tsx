"use client";
import { useEffect, useMemo, useState } from "react";
import { connectSignalR } from "@/lib/live/signalr";
import { Card } from "@/components/ui/Card";

export default function LiveSignalRPage() {
  const url = process.env.NEXT_PUBLIC_SIGNALR_URL || "";
  const hub = process.env.NEXT_PUBLIC_SIGNALR_HUB || "/hub";
  const methods = useMemo(
    () => (process.env.NEXT_PUBLIC_SIGNALR_METHODS || "").split(",").map((s) => s.trim()).filter(Boolean),
    []
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("idle");
  const [client, setClient] = useState<null | { stop: () => Promise<void> }>(null);

  useEffect(() => {
    let active = true;
    async function run() {
      if (!url) return;
      setStatus("connecting");
      try {
        const c = await connectSignalR(url, hub, methods, (m, args) => {
          setLogs((prev) => [new Date().toISOString() + " " + m + " " + JSON.stringify(args), ...prev].slice(0, 200));
        });
        if (!active) return;
        setStatus("connected");
        setClient({ stop: c.stop });
      } catch (e: any) {
        setStatus("error: " + (e?.message || String(e)));
      }
    }
    run();
    return () => {
      active = false;
      if (client) client.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, hub, methods.join(",")]);

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">SignalR Live</h1>
      <Card title={`Status: ${status}${!url ? " (set NEXT_PUBLIC_SIGNALR_URL)" : ""}`}>
        <div className="text-xs text-gray-400 mb-2">Hub: {hub} • Methods: {methods.join(", ") || "(none)"}</div>
        <div className="h-96 overflow-auto bg-black/40 rounded p-2 text-xs">
          {logs.length === 0 ? <div className="text-gray-400">No messages yet</div> : null}
          <ul className="space-y-1">
            {logs.map((l, i) => (
              <li key={i} className="font-mono text-gray-200">{l}</li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
