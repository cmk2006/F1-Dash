"use client";
import Image from "next/image";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const i = (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
  return i || "?";
}

function colorFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 60% 40%)`;
}

function initialsDataUrl(text: string, size: number) {
  const bg = colorFromString(text);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='100%' height='100%' rx='${Math.floor(size / 5)}' fill='${bg}'/>
    <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,Segoe UI,Arial' font-size='${Math.floor(size * 0.5)}' fill='white'>${initials(
      text
    )}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const TEAM_SLUG_MAP: Array<{ match: RegExp; slug: string }> = [
  { match: /red\s*bull|oracle\s*red\s*bull|rbr|rbpt/i, slug: "red-bull-racing" },
  { match: /mercedes|amg/i, slug: "mercedes" },
  { match: /ferrari|scuderia\s*ferrari/i, slug: "ferrari" },
  { match: /mclaren/i, slug: "mclaren" },
  { match: /aston\s*martin|aramco|cognizant/i, slug: "aston-martin" },
  { match: /alpine|bwt\s*alpine/i, slug: "alpine" },
  { match: /williams/i, slug: "williams" },
  { match: /\brb\b|racing\s*bulls|visa\s*cash\s*app\s*rb/i, slug: "rb" },
  { match: /sauber|stake|kick\s*sauber/i, slug: "sauber" },
  { match: /haas/i, slug: "haas" },
];

function teamSlug(name: string): string | null {
  for (const { match, slug } of TEAM_SLUG_MAP) if (match.test(name)) return slug;
  return null;
}

export function TeamLogo({ name, size = 20 }: { name?: string; size?: number }) {
  const placeholder = "/logos/teams/_placeholder.svg";
  if (!name) return <Image src={placeholder} alt="team" width={size} height={size} className="inline-block rounded" />;
  const mapped = teamSlug(name) || slugify(name);
  const candidates = [
    `/logos/teams/${mapped}.svg`,
    `/logos/teams/${mapped}.png`,
  ];
  // Use first candidate and rely on onError to swap to placeholder
  return (
    <Image
      src={candidates[0]}
      alt={name}
      width={size}
      height={size}
      className="inline-block rounded"
      onError={(e) => {
        // @ts-ignore - progressive fallback, finally placeholder
        const img = e.currentTarget as HTMLImageElement;
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("Team logo not found for", name, "expected one of:", candidates);
        }
        if (img.src.endsWith(`${mapped}.svg`)) img.src = candidates[1];
        else img.src = initialsDataUrl(name, size);
      }}
    />
  );
}

export function DriverAvatar({ name, size = 20, number }: { name?: string; size?: number; number?: number | string }) {
  // Explicitly do not use driver logos; always render a number-based tile
  const label = String(number ?? (name ?? "?"));
  const dataUrl = initialsDataUrl(label, size);
  return <Image src={dataUrl} alt={name ?? "driver"} width={size} height={size} className="inline-block rounded-full" />;
}
