import {
  Difficulty,
  Prisma,
  Severity,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middleware/errorHandler";
import { generateIncidentData } from "./incident.generator";
import { calculateInvestigationScore } from "./score.service";

export async function startIncident(
  scenarioId: string,
  userId: string
) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
  });

  if (!scenario) {
    throw new AppError("Scenario not found", 404);
  }

  if (!scenario.isPublished) {
    throw new AppError("Scenario is not available", 404);
  }

  const generated = generateIncidentData(scenario);

  const now = new Date();

  const incident = await prisma.$transaction(async (tx) => {
    const createdIncident = await tx.incident.create({
      data: {
        scenarioId: scenario.id,
        title: scenario.name,
        description: scenario.description,
        type: scenario.attackType,
        difficulty: scenario.difficulty,
        severity: scenario.severity,
        status: "DETECTED",
        startTime: now,
      },
    });

    if (generated.systems.length > 0) {
      await tx.system.createMany({
        data: generated.systems.map((system) => ({
          incidentId: createdIncident.id,
          name: system.name,
          type: system.type,
          status: system.status,
          metadata: system.metadata,
        })),
      });
    }

    if (generated.events.length > 0) {
      await tx.securityEvent.createMany({
        data: generated.events.map((event) => ({
          incidentId: createdIncident.id,
          eventType: event.eventType,
          severity: event.severity,
          sourceSystem: event.sourceSystem,
          user: event.user,
          sourceIP: event.sourceIP,
          destinationIP: event.destinationIP,
          description: event.description,
          metadata: event.metadata,
          timestamp: event.timestamp,
        })),
      });
    }

    if (generated.evidence.length > 0) {
      await tx.evidence.createMany({
        data: generated.evidence.map((item) => ({
          incidentId: createdIncident.id,
          type: item.type,
          severity: item.severity,
          description: item.description,
          source: item.source,
          timestamp: item.timestamp,
        })),
      });
    }

    await tx.investigation.create({
      data: {
        userId,
        incidentId: createdIncident.id,
        status: "NOT_STARTED",
      },
    });

    return createdIncident;
  });

  return prisma.incident.findUnique({
    where: { id: incident.id },
    include: {
      systems: true,
      securityEvents: {
        orderBy: { timestamp: "asc" },
      },
      evidence: {
        orderBy: { timestamp: "asc" },
      },
      investigations: {
        where: { userId },
      },
    },
  });
}

export async function getIncidentById(
  incidentId: string,
  userId: string
) {
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      investigations: {
        some: {
          userId,
        },
      },
    },
    include: {
      systems: true,
      securityEvents: {
        orderBy: {
          timestamp: "asc",
        },
      },
      evidence: {
        orderBy: {
          timestamp: "asc",
        },
      },
      investigations: {
        where: { userId },
        include: {
          actions: {
            orderBy: { createdAt: "desc" },
          },
          findings: {
            orderBy: { createdAt: "desc" },
          },
          score: true,
        },
      },
    },
  });

  if (!incident) {
    throw new AppError("Incident not found", 404);
  }

  return incident;
}

export async function startInvestigation(
  incidentId: string,
  userId: string
) {
  const investigation = await prisma.investigation.findFirst({
    where: {
      incidentId,
      userId,
    },
  });

  if (!investigation) {
    throw new AppError("Investigation not found", 404);
  }

  if (investigation.status === "COMPLETED") {
    throw new AppError(
      "Investigation has already been completed",
      400
    );
  }

  if (investigation.status === "IN_PROGRESS") {
    return investigation;
  }

  return prisma.investigation.update({
    where: {
      id: investigation.id,
    },
    data: {
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
  });
}

export async function performInvestigationAction(
  incidentId: string,
  userId: string,
  actionType: string,
  targetId?: string,
) {
  const investigation = await prisma.investigation.findFirst({
    where: {
      incidentId,
      userId,
    },
  });

  if (!investigation) {
    throw new AppError("Investigation not found", 404);
  }

  if (investigation.status !== "IN_PROGRESS") {
    throw new AppError(
      "Investigation is not in progress",
      400,
    );
  }

  const previousValidAction =
    await prisma.investigationAction.findFirst({
      where: {
        investigationId: investigation.id,
        actionType,
        targetId: targetId ?? null,
        wasValid: true,
      },
    });

  const incident = await prisma.incident.findUnique({
    where: {
      id: incidentId,
    },
    include: {
      scenario: true,
      systems: true,
      securityEvents: {
        orderBy: {
          timestamp: "asc",
        },
      },
    },
  });

  if (!incident) {
    throw new AppError("Incident not found", 404);
  }

  const requiredActions =
    incident.scenario.requiredActions as string[];

  let wasValid =
    requiredActions.includes(actionType) &&
    !previousValidAction;
  /*
   * Determine the compromised system from the simulated
   * security events.
   *
   * For the phishing scenario, CREDENTIAL_SUBMISSION is the
   * strongest indicator of the initially compromised endpoint.
   *
   * We intentionally use the event's sourceSystem instead of
   * hard-coding a system name.
   */
  if (actionType === "ISOLATE_SYSTEM") {
    if (!targetId) {
      wasValid = false;
    } else {
      const targetSystem = incident.systems.find(
        (system) => system.id === targetId,
      );

      if (!targetSystem) {
        wasValid = false;
      } else {
        const credentialSubmissionEvent =
          incident.securityEvents.find(
            (event) =>
              event.eventType === "CREDENTIAL_SUBMISSION",
          );

        const compromisedSystemName =
          credentialSubmissionEvent?.sourceSystem;

        wasValid =
          wasValid &&
          targetSystem.name === compromisedSystemName;
      }
    }
  }

  const action = await prisma.investigationAction.create({
    data: {
      investigationId: investigation.id,
      actionType,
      targetId,
      wasValid,
    },
  });

  if (
    actionType === "ISOLATE_SYSTEM" &&
    wasValid &&
    targetId
  ) {
    await prisma.system.update({
      where: {
        id: targetId,
      },
      data: {
        status: "ISOLATED",
      },
    });
  }

  return action;
}

export async function submitFinding(
  incidentId: string,
  userId: string,
  category: string,
  content: string,
) {
  const investigation = await prisma.investigation.findFirst({
    where: {
      incidentId,
      userId,
    },
    include: {
      incident: {
        include: {
          scenario: true,
          securityEvents: {
            orderBy: {
              timestamp: "asc",
            },
          },
        },
      },
    },
  });

  if (!investigation) {
    throw new AppError("Investigation not found", 404);
  }

  if (investigation.status !== "IN_PROGRESS") {
    throw new AppError(
      "Investigation is not in progress",
      400,
    );
  }

  const scenario = investigation.incident.scenario;

  let isCorrect: boolean | null = null;

  if (category === "ROOT_CAUSE") {
    const studentFinding = content.toLowerCase().trim();
    const rootCause = scenario.rootCause.toLowerCase().trim();

    const keywords = [
      "credential",
      "phishing",
      "employee",
      "fake",
      "login",
      "website",
    ];

    const matchedKeywords = keywords.filter((keyword) =>
      studentFinding.includes(keyword),
    );

    isCorrect =
      matchedKeywords.length >= 2 &&
      (
        studentFinding.includes("credential") ||
        studentFinding.includes("login")
      ) &&
      (
        studentFinding.includes("phishing") ||
        studentFinding.includes("fake") ||
        studentFinding.includes("website")
      );
  }
  if (category === "AFFECTED_SYSTEM") {
    const studentFinding = content
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .trim();

    const affectedSystems =
      scenario.affectedSystems.map((system) =>
        system
          .toLowerCase()
          .replace(/[_-]/g, " ")
          .trim(),
      );

    isCorrect = affectedSystems.some((system) => {
      return studentFinding.includes(system);
    });
  }
  if (category === "TIMELINE") {
    const studentFinding = content.toLowerCase();

    const phishingEmailIndex = Math.min(
      ...[
        studentFinding.indexOf("phishing email"),
        studentFinding.indexOf("phishing"),
      ].filter((index) => index >= 0),
    );

    const linkClickIndex = Math.min(
      ...[
        studentFinding.indexOf("clicked the link"),
        studentFinding.indexOf("clicking the link"),
        studentFinding.indexOf("clicked"),
        studentFinding.indexOf("link"),
      ].filter((index) => index >= 0),
    );

    const credentialIndex = Math.min(
      ...[
        studentFinding.indexOf("credential"),
        studentFinding.indexOf("password"),
        studentFinding.indexOf("credentials"),
      ].filter((index) => index >= 0),
    );

    const authenticationIndex = Math.min(
      ...[
        studentFinding.indexOf("unusual authentication"),
        studentFinding.indexOf("unusual login"),
        studentFinding.indexOf("suspicious login"),
        studentFinding.indexOf("logged in"),
        studentFinding.indexOf("login"),
      ].filter((index) => index >= 0),
    );

    const indexes = [
      phishingEmailIndex,
      linkClickIndex,
      credentialIndex,
      authenticationIndex,
    ];

    const validIndexes = indexes.filter(
      (index) => index >= 0,
    );

    const hasEnoughEvents = validIndexes.length >= 3;

    const isOrdered = validIndexes.every(
      (index, position) => {
        if (position === 0) {
          return true;
        }

        const previousIndex = validIndexes[position - 1];

        return (
          previousIndex !== undefined &&
          index > previousIndex
        );
      },
    );
    isCorrect = hasEnoughEvents && isOrdered;
  }
  const finding = await prisma.finding.create({
    data: {
      investigationId: investigation.id,
      category,
      content,
      isCorrect,
    },
  });

  return finding;
}

export async function completeInvestigation(
  incidentId: string,
  userId: string,
) {
  const investigation = await prisma.investigation.findFirst({
    where: {
      incidentId,
      userId,
    },
    include: {
      actions: true,
    },
  });

  if (!investigation) {
    throw new AppError("Investigation not found", 404);
  }

  if (investigation.status !== "IN_PROGRESS") {
    throw new AppError(
      "Investigation is not in progress",
      400,
    );
  }

  const validActions = investigation.actions.filter(
    (action) => action.wasValid === true,
  );

  if (validActions.length === 0) {
    throw new AppError(
      "Perform at least one valid investigation action before completing",
      400,
    );
  }

  const completedInvestigation = await prisma.investigation.update({
    where: { id: investigation.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  const score = await calculateInvestigationScore(
    investigation.id,
  );

  return {
    investigation: completedInvestigation,
    score,
  };
}