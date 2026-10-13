import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { healthRouter } from "./modules/health/health.routes";
import { errorHandler } from "./middleware/errorHandler";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { scenarioRouter } from "./modules/scenarios/scenario.routes";
import { incidentRouter } from "./modules/incidents/incident.route";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/scenarios", scenarioRouter);
  app.use("/api/incidents", incidentRouter);
  
  app.use(errorHandler);

  return app;
}
