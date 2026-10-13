import { NextFunction, Response } from "express";
import { AppError } from "./errorHandler";
import { AuthenticatedRequest } from "./authenticate";

export function requireRole(...allowedRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      next(new AppError("Authentication required", 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("You do not have permission to perform this action", 403));
      return;
    }

    next();
  };
}