/**
 * Risk Level Enum — Enterprise Platform SSOT
 *
 * Represents normalized risk levels for moderation policy decisions.
 */
export const RISK_LEVEL = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
} as const;

export type RiskLevelValue = (typeof RISK_LEVEL)[keyof typeof RISK_LEVEL];

export const RISK_LEVEL_VALUES = Object.values(RISK_LEVEL) as [
    RiskLevelValue,
    ...RiskLevelValue[]
];
