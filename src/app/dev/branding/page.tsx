import fs from "fs";
import path from "path";
import { Card } from "@/components/ui/Card";
import { teamSlug, slugify } from "@/lib/branding";

const TEAMS = [
  "Red Bull Racing",
  "Mercedes",
  "Ferrari",
  "McLaren",
  "Aston Martin",
  "Alpine",
  "Williams",
  "RB",
  "Sauber",
  "Haas",
];

export default function BrandingDevPage() {
  const pub = path.join(process.cwd(), "public", "logos", "teams");
  const present = new Set<string>(fs.existsSync(pub) ? fs.readdirSync(pub) : []);
  const rows = TEAMS.map((t) => {
    const s = teamSlug(t) || slugify(t);
    const svg = `${s}.svg`;
    const png = `${s}.png`;
    return { team: t, slug: s, hasSvg: present.has(svg), hasPng: present.has(png) };
  });
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Branding diagnostics</h1>
      <Card title="Teams">
        <table className="min-w-full text-sm">
          <thead><tr><th className="text-left p-2">Team</th><th className="text-left p-2">Slug</th><th className="text-left p-2">SVG</th><th className="text-left p-2">PNG</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.team} className="border-t border-white/10">
                <td className="p-2">{r.team}</td>
                <td className="p-2">{r.slug}</td>
                <td className="p-2">{r.hasSvg ? "✅" : "❌"}</td>
                <td className="p-2">{r.hasPng ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-gray-400">Place files at public/logos/teams/&lt;slug&gt;.svg or .png</p>
    </div>
  );
}
