import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate";
import { AppError } from "../../middleware/errorHandler";
import {
  completeInvestigation,
  getIncidentById,
  performInvestigationAction,
  startIncident,
  startInvestigation,
  submitFinding,
} from "./incident.service";
import {
  findingSchema,
  investigationActionSchema,
} from "./incident.validation";
import { generateInvestigationReport } from "./report.service";

export async function start(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { scenarioId } = req.params;

    if (!scenarioId) {
      throw new AppError("Scenario ID is required", 400);
    }

    const incident = await startIncident(
      scenarioId,
      req.user.id
    );

    res.status(201).json({
      incident,
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
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { incidentId } = req.params;

    if (!incidentId) {
      throw new AppError("Incident ID is required", 400);
    }

    const incident = await getIncidentById(
      incidentId,
      req.user.id
    );

    res.status(200).json({
      incident,
    });
  } catch (error) {
    next(error);
  }
}

export async function startInvestigationController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { incidentId } = req.params;

    if (!incidentId) {
      throw new AppError("Incident ID is required", 400);
    }

    const investigation = await startInvestigation(
      incidentId,
      req.user.id
    );

    res.status(200).json({
      investigation,
    });
  } catch (error) {
    next(error);
  }
}

export async function performAction(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { incidentId } = req.params;

    if (!incidentId) {
      throw new AppError("Incident ID is required", 400);
    }

    const parsed = investigationActionSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid investigation action", 400);
    }

    const { actionType, targetId } = parsed.data;

    const action = await performInvestigationAction(
      incidentId,
      req.user.id,
      actionType,
      targetId,
    );

    res.status(201).json({ action });
  } catch (error) {
    next(error);
  }
}

export async function submitFindingController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { incidentId } = req.params;

    if (!incidentId) {
      throw new AppError("Incident ID is required", 400);
    }

    const parsed = findingSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid finding", 400);
    }

    const { category, content } = parsed.data;

    const finding = await submitFinding(
      incidentId,
      req.user.id,
      category,
      content,
    );

    res.status(201).json({
      finding,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeInvestigationController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { incidentId } = req.params;

    if (!incidentId) {
      throw new AppError("Incident ID is required", 400);
    }

    const investigation = await completeInvestigation(
      incidentId,
      req.user.id,
    );

    res.status(200).json({
      message: "Investigation completed successfully",
      investigation,
    });
  } catch (error) {
    next(error);
  }
}

export async function generateReportController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { incidentId } = req.params;

    if (!incidentId) {
      throw new AppError("Incident ID is required", 400);
    }

    const report = await generateInvestigationReport(
      incidentId,
      req.user.id,
    );

    res.status(201).json({
      message: "Investigation report generated successfully",
      report,
    });
  } catch (error) {
    next(error);
  }
}