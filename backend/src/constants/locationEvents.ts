export const LOCATION_EVENT_SOURCES = ['auto', 'ip', 'manual', 'default'] as const;

export const LOCATION_EVENT_REASONS = [
    'manual_override',
    'gps_denied',
    'permission_denied',
    'timeout',
    'insecure_context',
    'ip_fallback',
    'manual_select',
    'gps_allowed',
    'fallback',
] as const;

export type LocationEventSource = (typeof LOCATION_EVENT_SOURCES)[number];
export type LocationEventReason = (typeof LOCATION_EVENT_REASONS)[number];
