/**
 * Service Type Shared Definitions
 */
export declare const SERVICE_SELECTION_MODES: {
    readonly SINGLE: "single";
    readonly MULTI: "multi";
};
export type ServiceSelectionMode = typeof SERVICE_SELECTION_MODES[keyof typeof SERVICE_SELECTION_MODES];
export declare const DEFAULT_SERVICE_SELECTION_MODE: ServiceSelectionMode;
