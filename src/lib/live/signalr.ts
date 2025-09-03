"use client";
import * as signalR from "@microsoft/signalr";

export type SignalRClient = {
  connection: signalR.HubConnection;
  stop: () => Promise<void>;
};

export async function connectSignalR(
  url: string,
  hubPath: string,
  methods: string[] = [],
  onMessage?: (method: string, payload: any[]) => void
): Promise<SignalRClient> {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${url}${hubPath}`)
    .withAutomaticReconnect({ nextRetryDelayInMilliseconds: () => 3000 })
    .configureLogging(signalR.LogLevel.Information)
    .build();

  methods.forEach((m) => {
    connection.on(m, (...args) => onMessage?.(m, args));
  });

  await connection.start();
  return { connection, stop: () => connection.stop() };
}
