export declare const LOCATION_EVENT_SOURCES: readonly ["auto", "ip", "manual", "default"];
export declare const LOCATION_EVENT_REASONS: readonly ["manual_override", "gps_denied", "permission_denied", "timeout", "insecure_context", "ip_fallback", "manual_select", "gps_allowed", "fallback"];
export declare const LOCATION_EVENT_TYPES: readonly ["location_search", "ad_view", "ad_post"];
export type LocationEventSource = (typeof LOCATION_EVENT_SOURCES)[number];
export type LocationEventReason = (typeof LOCATION_EVENT_REASONS)[number];
export type LocationEventType = (typeof LOCATION_EVENT_TYPES)[number];
//# sourceMappingURL=locationEvents.d.ts.map