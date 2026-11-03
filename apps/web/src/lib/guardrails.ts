/**
 * Data Guardrails & Invariant Validation Library
 * Implements INV-001, B-M0-01, and B-M0-02 rules.
 */

import { z } from "zod";

export const AI_AGENT_SIGNATURE_REGEX =
  /(^|\b|_|-)(ai|gpt|claude|gemini|synthetic|bot|llm|copilot|autogen|openai|anthropic)(\b|_|-|$)/i;

export const VALID_EQUATION_IDS: Record<string, true> = {
  "EQ-001": true,
  "EQ-002": true,
  "EQ-003": true,
  "EQ-004": true,
};

export const VALID_DATASET_IDS: Record<string, true> = {
  "DS-001": true,
  "DS-002": true,
  "DS-003": true,
  "DS-004": true,
  "DS-005": true,
};

export const VerificationStatusSchema = z.enum([
  "VERIFIED",
  "ESTIMATE",
  "NOT_AVAILABLE",
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const EquationIdSchema = z.enum([
  "EQ-001",
  "EQ-002",
  "EQ-003",
  "EQ-004",
]);
export type EquationId = z.infer<typeof EquationIdSchema>;

export const DatasetIdSchema = z.enum([
  "DS-001",
  "DS-002",
  "DS-003",
  "DS-004",
  "DS-005",
]);
export type DatasetId = z.infer<typeof DatasetIdSchema>;

export const ConfidenceLevelSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

/**
 * Verification metadata schema strictly enforcing:
 * - NV-001: No AI model or synthetic bot can ever mark status as VERIFIED.
 * - NV-002: VERIFIED requires official_source_name and official_source_url (http/https).
 * - NV-004: ESTIMATE requires non-empty derivation_note (chk_verification_derivation).
 */
export const VerificationMetaSchema = z
  .object({
    id: z.string().uuid().optional(),
    status: VerificationStatusSchema,
    official_source_name: z.string().min(1).nullable().optional(),
    official_source_url: z.string().url().nullable().optional(),
    derivation_note: z.string().nullable().optional(),
    last_verified_at: z.string().datetime().nullable().optional(),
    verified_by: z.string().min(1).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // NV-001: Reject AI-assigned VERIFIED status
    if (data.status === "VERIFIED" && data.verified_by) {
      if (AI_AGENT_SIGNATURE_REGEX.test(data.verified_by)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `INV-001 Violation: AI / synthetic agent (${data.verified_by}) is prohibited from assigning VERIFIED status.`,
          path: ["status"],
        });
      }
    }

    // NV-002: VERIFIED status requires official primary source documentation
    if (data.status === "VERIFIED") {
      if (!data.official_source_name || data.official_source_name.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "INV-001 / NV-002 Violation: VERIFIED records require an official_source_name.",
          path: ["official_source_name"],
        });
      }
      if (!data.official_source_url || data.official_source_url.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "INV-001 / NV-002 Violation: VERIFIED records require a valid official_source_url.",
          path: ["official_source_url"],
        });
      }
    }

    // NV-004: ESTIMATE status requires derivation note (chk_verification_derivation)
    if (data.status === "ESTIMATE") {
      if (!data.derivation_note || data.derivation_note.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "chk_verification_derivation Violation: ESTIMATE records require a non-empty derivation_note.",
          path: ["derivation_note"],
        });
      }
    }
  });

export type VerificationMeta = z.infer<typeof VerificationMetaSchema>;

/**
 * Derived calculation schema asserting that every calculated number cites an equation ID.
 */
export const DerivedCalculationSchema = z.object({
  metric_name: z.string().min(1),
  value: z.number(),
  equation_id: EquationIdSchema,
  input_dataset_ids: z.array(DatasetIdSchema).min(1),
  confidence_level: ConfidenceLevelSchema,
  derivation_note: z.string().min(1),
  calculated_at: z.string().datetime().optional(),
});

export type DerivedCalculation = z.infer<typeof DerivedCalculationSchema>;

/**
 * Validates a verification metadata object against INV-001 rules
 */
export function validateVerificationMeta(data: unknown) {
  return VerificationMetaSchema.safeParse(data);
}

/**
 * Validates a derived calculation against the glass-box equation registry
 */
export function validateDerivedCalculation(data: unknown) {
  return DerivedCalculationSchema.safeParse(data);
}
