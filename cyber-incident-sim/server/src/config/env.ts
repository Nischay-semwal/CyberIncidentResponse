import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Only what this milestone actually uses. Auth-related variables
// (JWT_SECRET etc.) are added in Milestone 2 when auth is implemented.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  SESSION_COOKIE_NAME: z
    .string()
    .min(1)
    .default("cis_session"),

  SESSION_TTL_DAYS: z.coerce
    .number()
    .int()
    .positive()
    .default(7),

  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loudly rather than starting the server with bad config.
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
