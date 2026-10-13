import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type Scenario = {
  id: string;
  name: string;
  description: string;
  attackType: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedSystems: string[];
};

type ScenarioListPageProps = {
  onScenarioSelected: (scenarioId: string) => void;
};

export default function ScenarioListPage({
  onScenarioSelected,
}: ScenarioListPageProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadScenarios() {
      try {
        const response = await fetch(`${API_URL}/api/scenarios`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load scenarios");
        }

        setScenarios(data.scenarios);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load scenarios",
        );
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-300">Loading scenarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Unable to load scenarios
          </h1>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-sm text-cyan-400 font-semibold uppercase tracking-wider">
            Cyber Incident Response Simulator
          </p>

          <h1 className="text-4xl font-bold mt-2">
            Select an Incident Scenario
          </h1>

          <p className="text-slate-400 mt-3 max-w-2xl">
            Choose a simulated security incident to begin your
            investigation.
          </p>
        </div>

        {scenarios.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400">
              No scenarios are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                    {scenario.attackType}
                  </span>

                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                    {scenario.severity}
                  </span>
                </div>

                <h2 className="text-xl font-bold">
                  {scenario.name}
                </h2>

                <p className="text-slate-400 text-sm mt-3 leading-6">
                  {scenario.description}
                </p>

                <div className="mt-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Difficulty
                  </p>

                  <p className="text-sm text-slate-200 mt-1">
                    {scenario.difficulty}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Affected Systems
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {scenario.affectedSystems.map((system) => (
                      <span
                        key={system}
                        className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded"
                      >
                        {system}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onScenarioSelected(scenario.id)}
                  className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  Select Scenario
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}