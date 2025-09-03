import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/schedule/${new Date().getFullYear()}`, { next: { revalidate: 300 } }).catch(() => null);
  if (!res || !res.ok) {
    // Fallback direct to current season endpoint
    const year = new Date().getFullYear();
    const proxy = await fetch(`https://api.jolpi.ca/ergast/f1/${year}.json`, { next: { revalidate: 300 } });
    return NextResponse.json(await proxy.json());
  }
  const json = await res.json();
  return NextResponse.json(json);
}
