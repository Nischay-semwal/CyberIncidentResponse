import { Router } from "express";
import {
  create,
  getById,
  list,
  publish,
  remove,
  update,
} from "./scenario.controller";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";

export const scenarioRouter = Router();

scenarioRouter.use(authenticate);

scenarioRouter.get("/", list);

scenarioRouter.get("/:id", getById);

scenarioRouter.post(
  "/",
  requireRole("INSTRUCTOR", "ADMIN"),
  create
);

scenarioRouter.patch(
  "/:id",
  requireRole("INSTRUCTOR", "ADMIN"),
  update
);

scenarioRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  remove
);

scenarioRouter.patch(
  "/:id/publish",
  requireRole("INSTRUCTOR", "ADMIN"),
  publish
);