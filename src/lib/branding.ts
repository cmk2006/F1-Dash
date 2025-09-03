export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
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

export function teamSlug(name: string): string | null {
  for (const { match, slug } of TEAM_SLUG_MAP) if (match.test(name)) return slug;
  return null;
}
