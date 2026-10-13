import { prisma } from "../../config/prisma";
import { AppError } from "../../middleware/errorHandler";

const DETECTION_ACTIONS = [
  "REVIEW_USER_ACTIVITY",
  "ESCALATE_INCIDENT",
];

const CONTAINMENT_ACTIONS = [
  "ISOLATE_SYSTEM",
  "BLOCK_IP",
  "BLOCK_NETWORK_CONNECTION",
];

const REMEDIATION_ACTIONS = [
  "RESET_CREDENTIALS",
  "DISABLE_ACCOUNT",
  "TERMINATE_PROCESS",
];

function getRuleScore(
  rules: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = rules[key];

  return typeof value === "number" ? value : fallback;
}

export async function calculateInvestigationScore(
  investigationId: string,
) {
  const investigation = await prisma.investigation.findUnique({
    where: {
      id: investigationId,
    },
    include: {
      actions: true,
      findings: true,
      incident: {
        include: {
          scenario: true,
          systems: true,
        },
      },
    },
  });

  if (!investigation) {
    throw new AppError("Investigation not found", 404);
  }

  const rules =
    (investigation.incident.scenario.scoringRules as Record<
      string,
      unknown
    >) ?? {};

  const validActions = investigation.actions.filter(
    (action) => action.wasValid === true,
  );

  const validActionTypes = new Set(
    validActions.map((action) => action.actionType),
  );

  const detectionMax = getRuleScore(rules, "detection", 20);
  const rootCauseMax = getRuleScore(rules, "rootCause", 25);
  const affectedSystemsMax = getRuleScore(
    rules,
    "affectedSystems",
    20,
  );
  const containmentMax = getRuleScore(rules, "containment", 20);
  const remediationMax = getRuleScore(rules, "remediation", 15);

  const detectionScore = DETECTION_ACTIONS.some((action) =>
    validActionTypes.has(action),
  )
    ? detectionMax
    : 0;

  // Root-cause identification will be implemented with Findings.
  const rootCauseScore = investigation.findings.some(
    (finding) =>
      finding.category === "ROOT_CAUSE" &&
      finding.isCorrect === true,
  )
    ? rootCauseMax
    : 0;

  const affectedSystemScore = investigation.findings.some(
    (finding) =>
      finding.category === "AFFECTED_SYSTEM" &&
      finding.isCorrect === true,
  )
    ? affectedSystemsMax
    : 0;

  const containmentActionsUsed = CONTAINMENT_ACTIONS.filter((action) =>
    validActionTypes.has(action),
  );

  const requiredContainmentActions =
    CONTAINMENT_ACTIONS.filter((action) =>
      investigation.incident.scenario.requiredActions.includes(
        action as any,
      ),
    );

  const containmentScore =
    requiredContainmentActions.length > 0
      ? Math.round(
        (containmentActionsUsed.length /
          requiredContainmentActions.length) *
        containmentMax,
      )
      : 0;

  const remediationActionsUsed = REMEDIATION_ACTIONS.filter((action) =>
    validActionTypes.has(action),
  );

  const requiredRemediationActions =
    REMEDIATION_ACTIONS.filter((action) =>
      investigation.incident.scenario.requiredActions.includes(
        action as any,
      ),
    );

  const remediationScore =
    requiredRemediationActions.length > 0
      ? Math.round(
        (remediationActionsUsed.length /
          requiredRemediationActions.length) *
        remediationMax,
      )
      : 0;

  const reportScore = 0;
  const penaltyPoints = 0;

  const totalScore =
    detectionScore +
    rootCauseScore +
    affectedSystemScore +
    containmentScore +
    remediationScore +
    reportScore -
    penaltyPoints;

  const breakdown = {
    detection: {
      earned: detectionScore,
      max: detectionMax,
    },
    rootCause: {
      earned: rootCauseScore,
      max: rootCauseMax,
      note: "Will be scored through investigation findings.",
    },
    affectedSystems: {
      earned: affectedSystemScore,
      max: affectedSystemsMax,
    },
    containment: {
      earned: containmentScore,
      max: containmentMax,
      actionsUsed: containmentActionsUsed,
    },
    remediation: {
      earned: remediationScore,
      max: remediationMax,
      actionsUsed: remediationActionsUsed,
    },
    report: {
      earned: reportScore,
      max: 0,
    },
    penalties: {
      points: penaltyPoints,
    },
  };

  return prisma.score.upsert({
    where: {
      investigationId,
    },
    update: {
      detectionScore,
      rootCauseScore,
      affectedSystemScore,
      containmentScore,
      remediationScore,
      reportScore,
      penaltyPoints,
      totalScore,
      breakdown,
    },
    create: {
      investigationId,
      detectionScore,
      rootCauseScore,
      affectedSystemScore,
      containmentScore,
      remediationScore,
      reportScore,
      penaltyPoints,
      totalScore,
      breakdown,
    },
  });
}