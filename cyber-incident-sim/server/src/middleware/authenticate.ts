import { NextFunction, Request, Response } from "express";
import { getUserFromSession } from "../modules/auth/auth.service";
import { AppError } from "./errorHandler";
import { env } from "../config/env";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[env.SESSION_COOKIE_NAME];

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const user = await getUserFromSession(token);

    if (!user) {
      throw new AppError("Authentication required", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
