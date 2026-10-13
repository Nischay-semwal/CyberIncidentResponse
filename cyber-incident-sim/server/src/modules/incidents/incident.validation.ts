import { z } from "zod";

export const investigationActionSchema = z.object({
  actionType: z.enum([
    "DISABLE_ACCOUNT",
    "RESET_CREDENTIALS",
    "BLOCK_IP",
    "ISOLATE_SYSTEM",
    "TERMINATE_PROCESS",
    "BLOCK_NETWORK_CONNECTION",
    "REVIEW_USER_ACTIVITY",
    "ESCALATE_INCIDENT",
    "CLOSE_INCIDENT",
  ]),
  targetId: z.string().uuid().optional(),
});

export const findingSchema = z.object({
  category: z.string().min(1, "Finding category is required"),
  content: z
    .string()
    .min(5, "Finding must be at least 5 characters long")
    .max(1000, "Finding is too long"),
});

export type InvestigationActionInput = z.infer<
  typeof investigationActionSchema
>;