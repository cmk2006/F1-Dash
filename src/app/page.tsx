import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Welcome">
        <p className="text-gray-300">
          This is a minimal dashboard scaffold inspired by Delta Dash. Explore Standings and Pit Stop pages.
        </p>
      </Card>
      <Card title="Quick Stats">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/30 rounded p-3">
            <div className="text-xs text-gray-400">Sample</div>
            <div className="text-2xl font-semibold">42</div>
          </div>
          <div className="bg-black/30 rounded p-3">
            <div className="text-xs text-gray-400">Another</div>
            <div className="text-2xl font-semibold">1.23s</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
