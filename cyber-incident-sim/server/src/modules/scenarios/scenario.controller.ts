import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate";
import { AppError } from "../../middleware/errorHandler";
import {
  createScenario,
  deleteScenario,
  getScenarioById,
  getScenarios,
  publishScenario,
  updateScenario,
} from "./scenario.service";
import {
  createScenarioSchema,
  updateScenarioSchema,
} from "./scenario.validation";

function getScenarioId(id: string | undefined): string {
  if (!id) {
    throw new AppError("Scenario ID is required", 400);
  }

  return id;
}
export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createScenarioSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid scenario data", 400);
    }

    const scenario = await createScenario(parsed.data);

    res.status(201).json({
      scenario,
    });
  } catch (error) {
    next(error);
  }
}

export async function list(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const canSeeUnpublished =
      req.user?.role === "INSTRUCTOR" ||
      req.user?.role === "ADMIN";

    const scenarios = await getScenarios(
      canSeeUnpublished
    );

    res.json({
      scenarios,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const canSeeUnpublished =
      req.user?.role === "INSTRUCTOR" ||
      req.user?.role === "ADMIN";

    const scenario = await getScenarioById(
      getScenarioId(req.params.id),
      canSeeUnpublished
    );

    res.json({
      scenario,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateScenarioSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid scenario data", 400);
    }

    const scenario = await updateScenario(
      getScenarioId(req.params.id),
      parsed.data
    );

    res.json({
      scenario,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteScenario(getScenarioId(req.params.id));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function publish(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const scenario = await publishScenario(getScenarioId(req.params.id));

    res.json({
      scenario,
    });
  } catch (error) {
    next(error);
  }
}   