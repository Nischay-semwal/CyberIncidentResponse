import { z } from "zod";

const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);

const severitySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

const actionTypeSchema = z.enum([
  "DISABLE_ACCOUNT",
  "RESET_CREDENTIALS",
  "BLOCK_IP",
  "ISOLATE_SYSTEM",
  "TERMINATE_PROCESS",
  "BLOCK_NETWORK_CONNECTION",
  "REVIEW_USER_ACTIVITY",
  "ESCALATE_INCIDENT",
  "CLOSE_INCIDENT",
]);

export const createScenarioSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Scenario name must be at least 3 characters")
    .max(200),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000),

  attackType: z
    .string()
    .trim()
    .min(2)
    .max(100),

  difficulty: difficultySchema,

  severity: severitySchema,

  rootCause: z
    .string()
    .trim()
    .min(3)
    .max(2000),

  initialAccess: z
    .string()
    .trim()
    .min(3)
    .max(2000),

  affectedSystems: z
    .array(z.string().trim().min(1).max(200))
    .min(1)
    .max(50),

  requiredActions: z
    .array(actionTypeSchema)
    .min(1)
    .max(20),

 scoringRules: z.record(z.any()),

 eventTemplate: z.record(z.any()),

 evidenceTemplate: z.record(z.any()),
});

export const updateScenarioSchema =
  createScenarioSchema.partial();