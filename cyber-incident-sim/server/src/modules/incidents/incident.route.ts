import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import {
  start,
  getById,
  startInvestigationController,
  performAction,
  submitFindingController,
  completeInvestigationController,
  generateReportController,
} from "./incident.controller";

export const incidentRouter = Router();

incidentRouter.post(
  "/scenarios/:scenarioId/start",
  authenticate,
  requireRole("STUDENT"),
  start
);

incidentRouter.get(
  "/:incidentId",
  authenticate,
  requireRole("STUDENT"),
  getById
);

incidentRouter.post(
  "/:incidentId/start",
  authenticate,
  requireRole("STUDENT"),
  startInvestigationController
);

incidentRouter.post(
  "/:incidentId/actions",
  authenticate,
  requireRole("STUDENT"),
  performAction,
);

incidentRouter.post(
  "/:incidentId/findings",
  authenticate,
  requireRole("STUDENT"),
  submitFindingController,
);

incidentRouter.post(
  "/:incidentId/complete",
  authenticate,
  completeInvestigationController,
);

incidentRouter.post(
  "/:incidentId/report",
  authenticate,
  requireRole("STUDENT"),
  generateReportController,
);