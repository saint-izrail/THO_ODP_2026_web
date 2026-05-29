import { HealthStatusIndicator } from "@/components/health-status";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Tabungan Haji</h1>
      <div className="w-full max-w-md">
        <HealthStatusIndicator />
      </div>
    </main>
  );
}
