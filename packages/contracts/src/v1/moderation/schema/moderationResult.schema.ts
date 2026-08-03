/**
 * Moderation Result & Signal Schemas — Enterprise Platform SSOT
 */
import { z } from 'zod';
import { MODERATION_OUTCOME_VALUES } from '../enums/moderationOutcome';
import { RISK_LEVEL_VALUES } from '../enums/riskLevel';
import { MODERATION_REASON_VALUES } from '../enums/moderationReason';

export const ModerationSignalSchema = z.object({
    classifier: z.string(),
    score: z.number().min(0).max(1),
    details: z.record(z.string(), z.unknown()).optional(),
});

export const ModerationResultSchema = z.object({
    outcome: z.enum(MODERATION_OUTCOME_VALUES),
    riskLevel: z.enum(RISK_LEVEL_VALUES),
    reasons: z.array(z.enum(MODERATION_REASON_VALUES)),
    signals: z.array(ModerationSignalSchema),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ModerationSignalDTO = z.infer<typeof ModerationSignalSchema>;
export type ModerationResultDTO = z.infer<typeof ModerationResultSchema>;
