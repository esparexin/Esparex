/**
 * API Key Status Enum
 */
export declare const API_KEY_STATUS: {
    readonly ACTIVE: "active";
    readonly REVOKED: "revoked";
    readonly EXPIRED: "expired";
};
export type ApiKeyStatusValue = (typeof API_KEY_STATUS)[keyof typeof API_KEY_STATUS];
export declare const API_KEY_STATUS_VALUES: [ApiKeyStatusValue, ...ApiKeyStatusValue[]];
