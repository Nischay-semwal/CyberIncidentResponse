import { Router } from "express";
import {
  login,
  logout,
  me,
  register,
} from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, me);
authRouter.get(
  "/student-test",
  authenticate,
  requireRole("STUDENT"),
  (_req, res) => {
    res.json({ message: "Student access granted" });
  }
);

authRouter.get(
  "/admin-test",
  authenticate,
  requireRole("ADMIN"),
  (_req, res) => {
    res.json({ message: "Admin access granted" });
  }
);