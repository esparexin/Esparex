/**
 * API Key Status Enum
 */
export const API_KEY_STATUS = {
    ACTIVE: 'active',
    REVOKED: 'revoked',
    EXPIRED: 'expired'
} as const;

export type ApiKeyStatusValue = (typeof API_KEY_STATUS)[keyof typeof API_KEY_STATUS];
export const API_KEY_STATUS_VALUES = Object.values(API_KEY_STATUS) as [ApiKeyStatusValue, ...ApiKeyStatusValue[]];
