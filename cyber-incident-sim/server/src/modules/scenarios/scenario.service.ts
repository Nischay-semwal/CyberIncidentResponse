import { prisma } from "../../config/prisma";
import { AppError } from "../../middleware/errorHandler";
import {
  ActionType,
  Difficulty,
  Prisma,
  Severity,
} from "@prisma/client";

export async function createScenario(data: {
  name: string;
  description: string;
  attackType: string;
  difficulty: Difficulty;
  severity: Severity;
  rootCause: string;
  initialAccess: string;
  affectedSystems: string[];
  requiredActions: ActionType[];
  scoringRules: Prisma.InputJsonValue;
  eventTemplate: Prisma.InputJsonValue;
  evidenceTemplate: Prisma.InputJsonValue;
}) {
  return prisma.scenario.create({
    data,
  });
}

export async function getScenarios(
  includeUnpublished = false
) {
  if (includeUnpublished) {
    return prisma.scenario.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  return prisma.scenario.findMany({
    where: {
      isPublished: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      attackType: true,
      difficulty: true,
      severity: true,
      affectedSystems: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getScenarioById(
  id: string,
  includeUnpublished = false
) {
  if (includeUnpublished) {
    const scenario = await prisma.scenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new AppError("Scenario not found", 404);
    }

    return scenario;
  }

  const scenario = await prisma.scenario.findFirst({
    where: {
      id,
      isPublished: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      attackType: true,
      difficulty: true,
      severity: true,
      affectedSystems: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!scenario) {
    throw new AppError("Scenario not found", 404);
  }

  return scenario;
}

export async function updateScenario(
  id: string,
  data: Prisma.ScenarioUpdateInput
) {
  const existing = await prisma.scenario.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError("Scenario not found", 404);
  }

  if (existing.isPublished) {
    throw new AppError(
      "Published scenarios cannot be edited",
      409
    );
  }

  return prisma.scenario.update({
    where: { id },
    data,
  });
}

export async function deleteScenario(id: string) {
  const existing = await prisma.scenario.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          incidents: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError("Scenario not found", 404);
  }

  if (existing._count.incidents > 0) {
    throw new AppError(
      "Scenario cannot be deleted because incidents reference it",
      409
    );
  }

  await prisma.scenario.delete({
    where: { id },
  });
}

export async function publishScenario(id: string) {
  const existing = await prisma.scenario.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError("Scenario not found", 404);
  }

  if (existing.isPublished) {
    throw new AppError(
      "Scenario is already published",
      409
    );
  }

  return prisma.scenario.update({
    where: { id },
    data: {
      isPublished: true,
    },
  });
}