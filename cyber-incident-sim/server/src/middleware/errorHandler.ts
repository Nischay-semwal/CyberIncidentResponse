import { NextFunction, Request, Response } from "express";

// Thrown deliberately by route/service code for expected error cases
// (validation failures, not-found, unauthorized, etc.) so the handler
// below can respond with the right status code and a consistent shape.
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// Registered last in app.ts. Catches both AppErrors and unexpected
// exceptions so no route ever needs its own try/catch just for error
// formatting.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message },
    });
    return;
  }

  console.error("Unexpected error:", err);
  res.status(500).json({
    error: { message: "Internal server error" },
  });
}
