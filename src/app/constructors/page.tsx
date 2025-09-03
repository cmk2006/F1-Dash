import { Card } from "@/components/ui/Card";
import dynamic from "next/dynamic";
const TeamLogo = dynamic(() => import("@/components/ui/TeamLogo.client"), { ssr: false });

type JolpiConstructors = {
  MRData: { ConstructorTable: { Constructors: Array<{ constructorId: string; name: string; nationality: string; url: string }> } };
};

async function load() {
  const res = await fetch("https://api.jolpi.ca/ergast/f1/current/constructors.json", { next: { revalidate: 300 } });
  const json = (await res.json()) as JolpiConstructors;
  const constructors = json.MRData.ConstructorTable.Constructors.map((c) => ({
    id: c.constructorId,
    name: c.name,
    nationality: c.nationality,
    url: c.url,
  }));
  return { constructors };
}

export default async function ConstructorsPage() {
  const { constructors } = await load();
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Constructors</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {constructors.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center gap-3">
              <TeamLogo name={c.name} size={28} />
              <div className="space-y-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-400">{c.nationality}</div>
                <a className="text-xs text-blue-400 hover:underline" href={c.url} target="_blank">Wikipedia</a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
