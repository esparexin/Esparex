/**
 * Service Type Shared Definitions
 */
export const SERVICE_SELECTION_MODES = {
    SINGLE: 'single',
    MULTI: 'multi',
} as const;

export type ServiceSelectionMode = typeof SERVICE_SELECTION_MODES[keyof typeof SERVICE_SELECTION_MODES];

export const DEFAULT_SERVICE_SELECTION_MODE: ServiceSelectionMode = SERVICE_SELECTION_MODES.MULTI;
