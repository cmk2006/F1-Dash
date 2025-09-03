import { Card } from "@/components/ui/Card";
import dynamic from "next/dynamic";
const DriverAvatar = dynamic(() => import("@/components/ui/DriverAvatar.client"), { ssr: false });

type JolpiDrivers = {
  MRData: {
    DriverTable: { Drivers: Array<{ driverId: string; givenName: string; familyName: string; code?: string; permanentNumber?: string; nationality: string }> };
  };
};

async function load() {
  const res = await fetch("https://api.jolpi.ca/ergast/f1/current/drivers.json", { next: { revalidate: 300 } });
  const json = (await res.json()) as JolpiDrivers;
  const drivers = json.MRData.DriverTable.Drivers.map((d) => ({
    id: d.driverId,
    name: `${d.givenName} ${d.familyName}`,
    code: d.code ?? "",
    number: d.permanentNumber ?? "",
    nationality: d.nationality,
  }));
  return { drivers };
}

export default async function DriversPage() {
  const { drivers } = await load();
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Drivers</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {drivers.map((d) => (
          <Card key={d.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <DriverAvatar name={d.name} size={32} />
                <div>
                  <div className="text-sm text-gray-400">#{d.number}</div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-gray-400">{d.nationality}</div>
                </div>
              </div>
              <div className="text-lg font-bold text-gray-300">{d.code}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
