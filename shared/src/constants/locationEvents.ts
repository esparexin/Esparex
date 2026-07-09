export const LOCATION_EVENT_SOURCES = ["auto", "ip", "manual", "default"] as const;

export const LOCATION_EVENT_REASONS = [
    "manual_override",
    "gps_denied",
    "permission_denied",
    "timeout",
    "insecure_context",
    "ip_fallback",
    "manual_select",
    "gps_allowed",
    "fallback",
    "prompt_dismissed",
    "initial_prompt_shown",
    "permission_granted",
    "requesting_permission"
] as const;

export const LOCATION_EVENT_TYPES = [
    "location_search",
    "ad_view",
    "ad_post",
    "location_prompt_dismissed",
    "location_permission_granted",
    "location_prompt_shown",
    "location_permission_denied",
    "location_permission_requested"
] as const;

export type LocationEventSource = (typeof LOCATION_EVENT_SOURCES)[number];
export type LocationEventReason = (typeof LOCATION_EVENT_REASONS)[number];
export type LocationEventType = (typeof LOCATION_EVENT_TYPES)[number];
