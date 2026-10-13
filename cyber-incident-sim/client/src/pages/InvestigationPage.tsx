import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type Incident = {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  severity: string;
  status: string;
  startTime: string | null;

  systems: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
  }>;

  securityEvents: Array<{
    id: string;
    eventType: string;
    severity: string;
    sourceSystem: string;
    description: string;
    timestamp: string;
  }>;

  evidence: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    source: string;
    timestamp: string;
  }>;

  investigations: {
    id: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    hintsUsed: number;

    score?: {
      detectionScore: number;
      rootCauseScore: number;
      affectedSystemScore: number;
      containmentScore: number;
      remediationScore: number;
      reportScore: number;
      penaltyPoints: number;
      totalScore: number;
    };
    actions: {
      id: string;
      actionType: string;
      targetId: string | null;
      wasValid: boolean | null;
      createdAt: string;
    }[];

    findings: {
      id: string;
      category: string;
      content: string;
      isCorrect: boolean | null;
      createdAt: string;
    }[];
  }[];
};

type InvestigationPageProps = {
  incidentId: string;
};

export default function InvestigationPage({
  incidentId,
}: InvestigationPageProps) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startingInvestigation, setStartingInvestigation] =
    useState(false);
  const [completingInvestigation, setCompletingInvestigation] =
    useState(false);
  const [findingCategory, setFindingCategory] =
    useState("ROOT_CAUSE");

  const [findingContent, setFindingContent] =
    useState("");

  const [findingSubmitting, setFindingSubmitting] =
    useState(false);

  const [report, setReport] = useState<any>(null);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportError, setReportError] = useState("");
  useEffect(() => {
    fetch(`${API_URL}/api/incidents/${incidentId}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load incident");
        }

        return res.json();
      })
      .then((data) => {
        setIncident(data.incident);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [incidentId]);
  const handleGenerateReport = async () => {
    if (!incident) return;

    try {
      setReportGenerating(true);
      setReportError("");

      const response = await fetch(
        `${API_URL}/api/incidents/${incident.id}/report`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate report");
      }

      setReport(data.report);
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : "Failed to generate report"
      );
    } finally {
      setReportGenerating(false);
    }
  };
  const handleSubmitFinding = async () => {
    if (!incident || !investigation) return;

    if (!findingContent.trim()) {
      setError("Please enter a finding.");
      return;
    }

    try {
      setFindingSubmitting(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/incidents/${incident.id}/findings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            category: findingCategory,
            content: findingContent.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit finding",
        );
      }

      setIncident((current) => {
        if (!current) return current;

        return {
          ...current,
          investigations: current.investigations.map(
            (currentInvestigation) =>
              currentInvestigation.id === investigation.id
                ? {
                  ...currentInvestigation,
                  findings: [
                    data.finding,
                    ...(currentInvestigation.findings ?? []),
                  ],
                }
                : currentInvestigation,
          ),
        };
      });

      setFindingContent("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit finding",
      );
    } finally {
      setFindingSubmitting(false);
    }
  };

  async function handleStartInvestigation() {
    setStartingInvestigation(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${incidentId}/start`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? "Failed to start investigation",
        );
      }

      setIncident((current) => {
        if (!current) return current;

        return {
          ...current,
          investigations: current.investigations.map(
            (investigation) =>
              investigation.id === data.investigation.id
                ? {
                  ...investigation,
                  status: data.investigation.status,
                  startedAt: data.investigation.startedAt,
                }
                : investigation,
          ),
        };
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to start investigation",
      );
    } finally {
      setStartingInvestigation(false);
    }
  }
  async function handleCompleteInvestigation() {
    setCompletingInvestigation(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${incidentId}/complete`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? "Failed to complete investigation",
        );
      }

      const completedInvestigation = data.investigation.investigation;
      const score = data.investigation.score;

      setIncident((current) => {
        if (!current) return current;

        return {
          ...current,
          investigations: current.investigations.map(
            (investigation) =>
              investigation.id === completedInvestigation.id
                ? {
                  ...investigation,
                  status: completedInvestigation.status,
                  completedAt: completedInvestigation.completedAt,
                  score,
                }
                : investigation,
          ),
        };
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to complete investigation",
      );
    } finally {
      setCompletingInvestigation(false);
    }
  }
  async function handleAction(actionType: string, targetId?: string) {
    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${incidentId}/actions`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actionType,
            targetId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? "Failed to perform action",
        );
      }

      console.log("Action performed:", data.action);

      // Refresh the incident so Action History gets the latest action.
      const refreshedResponse = await fetch(
        `${API_URL}/api/incidents/${incidentId}`,
        {
          credentials: "include",
        },
      );

      if (!refreshedResponse.ok) {
        throw new Error(
          "Action succeeded, but failed to refresh incident",
        );
      }

      const refreshedData = await refreshedResponse.json();

      setIncident(refreshedData.incident);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to perform investigation action",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-slate-400">
          Loading investigation...
        </p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Unable to load investigation
          </h1>

          <p className="mt-2 text-red-400">
            {error || "Incident not found"}
          </p>
        </div>
      </div>
    );
  }

  const investigation = incident.investigations[0];

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl">
        {error && (
          <div className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}
        <h1 className="text-3xl font-bold">
          {incident.title}
        </h1>

        <p className="mt-2 text-slate-400">
          {incident.description}
        </p>

        {/* Incident Summary */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Type</p>

            <p className="mt-1 font-semibold">
              {incident.type}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">
              Difficulty
            </p>

            <p className="mt-1 font-semibold">
              {incident.difficulty}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">
              Severity
            </p>

            <p className="mt-1 font-semibold">
              {incident.severity}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">
              Investigation
            </p>

            <p className="mt-1 font-semibold">
              {investigation?.status ?? "UNKNOWN"}
            </p>
            {investigation?.completedAt && (
              <p className="mt-2 text-xs text-slate-500">
                Completed:{" "}
                {new Date(
                  investigation.completedAt,
                ).toLocaleString()}
              </p>
            )}
            {investigation?.status === "NOT_STARTED" && (
              <button
                onClick={handleStartInvestigation}
                disabled={startingInvestigation}
                className="mt-4 w-full rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {startingInvestigation
                  ? "Starting..."
                  : "Start Investigation"}
              </button>
            )}

            {investigation?.status === "IN_PROGRESS" && (
              <>
                <button
                  onClick={() =>
                    handleAction("RESET_CREDENTIALS")
                  }
                  className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Reset Credentials
                </button>

                <button
                  onClick={handleCompleteInvestigation}
                  disabled={completingInvestigation}
                  className="mt-3 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {completingInvestigation
                    ? "Completing..."
                    : "Complete Investigation"}
                </button>
              </>
            )}
          </div>
        </div>
        {investigation?.status === "IN_PROGRESS" && (
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Findings & Root Cause Analysis
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Record your observations and identify the likely root
              cause of the incident.
            </p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Finding Category
              </label>

              <select
                value={findingCategory}
                onChange={(event) =>
                  setFindingCategory(event.target.value)
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="ROOT_CAUSE">
                  Root Cause
                </option>

                <option value="AFFECTED_SYSTEM">
                  Affected System
                </option>

                <option value="TIMELINE">
                  Timeline
                </option>

                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Finding
              </label>

              <textarea
                value={findingContent}
                onChange={(event) =>
                  setFindingContent(event.target.value)
                }
                placeholder="Describe what you discovered..."
                rows={4}
                className="w-full resize-none rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitFinding}
              disabled={findingSubmitting || !findingContent.trim()}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {findingSubmitting
                ? "Submitting..."
                : "Submit Finding"}
            </button>
          </div>
        )}
        {investigation &&
          investigation.findings &&
          investigation.findings.length > 0 && (
            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Submitted Findings
              </h2>

              <div className="mt-4 space-y-3">
                {investigation.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-md border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-blue-400">
                        {finding.category.replace("_", " ")}
                      </span>

                      {finding.isCorrect !== null && (
                        <span
                          className={
                            finding.isCorrect
                              ? "text-sm font-medium text-green-400"
                              : "text-sm font-medium text-red-400"
                          }
                        >
                          {finding.isCorrect
                            ? "Correct"
                            : "Incorrect"}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-300">
                      {finding.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        {/* Score Summary */}
        {investigation?.status === "COMPLETED" && investigation.score && (
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Investigation Score
              </h2>

              <span className="text-2xl font-bold text-green-400">
                {investigation.score.totalScore} points
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Detection</p>
                <p className="mt-1 text-lg font-semibold">
                  {investigation.score.detectionScore}
                </p>
              </div>

              <div className="rounded-lg bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Root Cause</p>
                <p className="mt-1 text-lg font-semibold">
                  {investigation.score.rootCauseScore}
                </p>
              </div>

              <div className="rounded-lg bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Affected Systems</p>
                <p className="mt-1 text-lg font-semibold">
                  {investigation.score.affectedSystemScore}
                </p>
              </div>

              <div className="rounded-lg bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Containment</p>
                <p className="mt-1 text-lg font-semibold">
                  {investigation.score.containmentScore}
                </p>
              </div>

              <div className="rounded-lg bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Remediation</p>
                <p className="mt-1 text-lg font-semibold">
                  {investigation.score.remediationScore}
                </p>
              </div>

              <div className="rounded-lg bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Penalties</p>
                <p className="mt-1 text-lg font-semibold">
                  {investigation.score.penaltyPoints}
                </p>
              </div>
            </div>
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold">
                Investigation Report
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Generate a detailed report containing the incident timeline,
                evidence, findings, actions, and final score.
              </p>

              <button
                onClick={handleGenerateReport}
                disabled={reportGenerating}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reportGenerating ? "Generating Report..." : "Generate Report"}
              </button>

              {reportError && (
                <p className="mt-3 text-sm text-red-600">
                  {reportError}
                </p>
              )}
              {report && (
                <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Investigation Report
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Generated investigation summary
                    </p>
                  </div>

                  {/* Incident */}
                  <div className="mb-6">
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Incident
                    </h4>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="font-medium">
                        {report.content.incident.title}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {report.content.incident.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                          {report.content.incident.severity}
                        </span>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                          {report.content.incident.type}
                        </span>

                        <span className="rounded-full bg-gray-200 px-3 py-1 text-gray-700">
                          {report.content.incident.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  {report.content.score && (
                    <div className="mb-6">
                      <h4 className="mb-2 font-semibold text-gray-900">
                        Final Score
                      </h4>

                      <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-3xl font-bold text-blue-600">
                          {report.content.score.totalScore} / 100
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                          <div>
                            <p className="text-xs text-gray-500">Detection</p>
                            <p className="font-semibold">
                              {report.content.score.detectionScore}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Root Cause</p>
                            <p className="font-semibold">
                              {report.content.score.rootCauseScore}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Systems</p>
                            <p className="font-semibold">
                              {report.content.score.affectedSystemScore}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Containment</p>
                            <p className="font-semibold">
                              {report.content.score.containmentScore}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Remediation</p>
                            <p className="font-semibold">
                              {report.content.score.remediationScore}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Systems */}
                  <div className="mb-6">
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Affected Systems
                    </h4>

                    <div className="space-y-2">
                      {report.content.systems.map((system: any) => (
                        <div
                          key={system.name}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{system.name}</p>
                            <p className="text-xs text-gray-500">{system.type}</p>
                          </div>

                          <span className="text-sm font-medium">
                            {system.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Findings */}
                  <div className="mb-6">
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Findings
                    </h4>

                    {report.content.findings.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No findings were submitted.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {report.content.findings.map((finding: any, index: number) => (
                          <div
                            key={index}
                            className="rounded-lg border p-4"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                {finding.category}
                              </p>

                              {finding.isCorrect !== null && (
                                <span
                                  className={`rounded-full px-3 py-1 text-xs ${finding.isCorrect
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                    }`}
                                >
                                  {finding.isCorrect ? "Correct" : "Incorrect"}
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-sm text-gray-600">
                              {finding.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mb-6">
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Investigation Actions
                    </h4>

                    {report.content.actions.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No actions were recorded.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {report.content.actions.map((action: any) => (
                          <div
                            key={action.createdAt}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <span className="text-sm font-medium">
                              {action.actionType}
                            </span>

                            <span
                              className={`text-xs font-medium ${action.wasValid
                                  ? "text-green-600"
                                  : "text-red-600"
                                }`}
                            >
                              {action.wasValid ? "Valid" : "Invalid"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Evidence */}
                  <div className="mb-6">
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Evidence
                    </h4>

                    <div className="space-y-2">
                      {report.content.evidence.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {item.type}
                            </p>

                            <span className="text-xs text-gray-500">
                              {item.severity}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-gray-600">
                            {item.description}
                          </p>

                          <p className="mt-2 text-xs text-gray-400">
                            Source: {item.source}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Incident Timeline
                    </h4>

                    <div className="space-y-3">
                      {report.content.timeline.map((event: any, index: number) => (
                        <div
                          key={index}
                          className="border-l-2 border-gray-300 pl-4"
                        >
                          <p className="text-sm font-medium">
                            {event.eventType}
                          </p>

                          <p className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {event.description}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Source: {event.sourceSystem}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Affected Systems */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold">
            Affected Systems
          </h2>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {incident.systems.map((system) => (
              <div
                key={system.id}
                className="rounded-lg border border-slate-800 bg-slate-900 p-4"
              >
                <p className="font-medium">
                  {system.name}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {system.type}
                </p>

                <p className="mt-2 text-sm">
                  Status: {system.status}
                </p>

                {investigation?.status === "IN_PROGRESS" && (
                  <button
                    onClick={() =>
                      handleAction(
                        "ISOLATE_SYSTEM",
                        system.id,
                      )
                    }
                    className="mt-4 w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Isolate System
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Investigation Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold">
            Investigation Actions
          </h2>

          {investigation?.actions?.length === 0 ? (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">
                No investigation actions performed yet.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {investigation?.actions?.map((action) => (
                <div
                  key={action.id}
                  className="rounded-lg border border-slate-800 bg-slate-900 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          action.wasValid === true
                            ? "text-green-400"
                            : action.wasValid === false
                              ? "text-red-400"
                              : "text-slate-400"
                        }
                      >
                        {action.wasValid === true
                          ? "✓"
                          : action.wasValid === false
                            ? "✗"
                            : "•"}
                      </span>

                      <p className="font-medium">
                        {action.actionType}
                      </p>
                    </div>

                    <span className="text-xs text-slate-500">
                      {new Date(action.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2 text-sm">
                    <span className="text-slate-400">
                      Result:{" "}
                    </span>

                    <span
                      className={
                        action.wasValid === true
                          ? "text-green-400"
                          : action.wasValid === false
                            ? "text-red-400"
                            : "text-slate-400"
                      }
                    >
                      {action.wasValid === true
                        ? "Valid action"
                        : action.wasValid === false
                          ? "Invalid action"
                          : "Not evaluated"}
                    </span>
                  </div>

                  {action.targetId && (
                    <p className="mt-1 text-xs text-slate-500">
                      Target:{" "}
                      {incident.systems.find(
                        (system) => system.id === action.targetId,
                      )?.name ?? action.targetId}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Events */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold">
            Security Events
          </h2>

          <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Source</th>
                  </tr>
                </thead>

                <tbody>
                  {incident.securityEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="border-t border-slate-800"
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(
                          event.timestamp,
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {event.eventType}
                        </p>

                        <p className="mt-1 text-slate-400">
                          {event.description}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        {event.severity}
                      </td>

                      <td className="px-4 py-3">
                        {event.sourceSystem}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold">
            Evidence
          </h2>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {incident.evidence.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-800 bg-slate-900 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {item.type}
                  </p>

                  <span className="text-sm text-slate-400">
                    {item.severity}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  {item.description}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Source: {item.source}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}