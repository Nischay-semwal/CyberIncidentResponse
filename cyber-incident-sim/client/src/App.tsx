import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import ScenarioListPage from "./pages/ScenarioListPage";
import InvestigationPage from "./pages/InvestigationPage";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [startingIncident, setStartingIncident] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    })
      .then((response) => {
        setAuthenticated(response.ok);
      })
      .catch(() => {
        setAuthenticated(false);
      });
  }, []);

  async function handleScenarioSelected(selectedScenarioId: string) {
    setScenarioId(selectedScenarioId);
    setStartingIncident(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/scenarios/${selectedScenarioId}/start`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to start incident");
      }

      setIncidentId(data.incident.id);
    } catch (error) {
      setScenarioId(null);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to start incident",
      );
    } finally {
      setStartingIncident(false);
    }
  }

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-300">Checking session...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  if (startingIncident) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-300">Starting incident...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3">
            Unable to start incident
          </h1>

          <p className="text-red-400">{error}</p>

          <button
            onClick={() => {
              setError("");
              setScenarioId(null);
            }}
            className="mt-5 bg-cyan-600 hover:bg-cyan-500 px-5 py-2 rounded-lg"
          >
            Back to Scenarios
          </button>
        </div>
      </div>
    );
  }

  if (!scenarioId) {
    return (
      <ScenarioListPage
        onScenarioSelected={handleScenarioSelected}
      />
    );
  }

  if (!incidentId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-300">Preparing investigation...</p>
      </div>
    );
  }

  return <InvestigationPage incidentId={incidentId} />;
}