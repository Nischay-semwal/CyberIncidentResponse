import { prisma } from "../../config/prisma";
import { AppError } from "../../middleware/errorHandler";

export async function generateInvestigationReport(
  incidentId: string,
  userId: string,
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
        },
      },
      actions: {
        orderBy: {
          createdAt: "asc",
        },
      },
      findings: {
        orderBy: {
          createdAt: "asc",
        },
      },
      score: true,
    },
  });

  if (!investigation) {
    throw new AppError("Investigation not found", 404);
  }

  if (investigation.status !== "COMPLETED") {
    throw new AppError(
      "Investigation must be completed before generating a report",
      400,
    );
  }

  const reportContent = {
    incident: {
      id: investigation.incident.id,
      title: investigation.incident.title,
      description: investigation.incident.description,
      type: investigation.incident.type,
      severity: investigation.incident.severity,
      difficulty: investigation.incident.difficulty,
      status: investigation.incident.status,
    },

    systems: investigation.incident.systems.map((system) => ({
      name: system.name,
      type: system.type,
      status: system.status,
    })),

    timeline: investigation.incident.securityEvents.map((event) => ({
      timestamp: event.timestamp,
      eventType: event.eventType,
      severity: event.severity,
      sourceSystem: event.sourceSystem,
      description: event.description,
    })),

    evidence: investigation.incident.evidence.map((item) => ({
      type: item.type,
      severity: item.severity,
      description: item.description,
      source: item.source,
      timestamp: item.timestamp,
    })),

    findings: investigation.findings.map((finding) => ({
      category: finding.category,
      content: finding.content,
      isCorrect: finding.isCorrect,
    })),

    actions: investigation.actions.map((action) => ({
      actionType: action.actionType,
      targetId: action.targetId,
      wasValid: action.wasValid,
      createdAt: action.createdAt,
    })),

    score: investigation.score,
  };

  const report = await prisma.report.upsert({
    where: {
      investigationId: investigation.id,
    },
    update: {
      content: reportContent,
    },
    create: {
      investigationId: investigation.id,
      userId,
      content: reportContent,
    },
  });

  return report;
}