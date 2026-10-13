import { NextFunction, Request, Response } from "express";
import {
  authenticateUser,
  deleteSession,
  registerUser,
} from "./auth.service";
import { loginSchema, registerSchema } from "./auth.validation";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";
import { AuthenticatedRequest } from "../../middleware/authenticate";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid registration data", 400);
    }

    const user = await registerUser(
      parsed.data.email,
      parsed.data.password,
      parsed.data.name
    );

    res.status(201).json({
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid email or password", 400);
    }

    const { user, token } = await authenticateUser(
      parsed.data.email,
      parsed.data.password
    );

    res.cookie(
      env.SESSION_COOKIE_NAME,
      token,
      {
        ...cookieOptions,
        maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
      }
    );

    res.json({
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[env.SESSION_COOKIE_NAME];

    if (token) {
      await deleteSession(token);
    }

    res.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export function me(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    res.json({
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}