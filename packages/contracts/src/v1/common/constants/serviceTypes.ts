/**
 * DEFAULT_SERVICE_TYPES
 * Standard service types used as fallbacks and for database seeding.
 * These should match the expected values in the Catalog and Service Wizard.
 */
export const DEFAULT_SERVICE_TYPES = [
    "Screen Replacement",
    "Battery Replacement",
    "Water Damage",
    "Software Issue",
    "Logic Board Repair",
    "Camera Repair",
    "Charging Port Repair",
    "Speaker/Mic Repair",
    "Back Glass Repair",
    "Other"
] as const;

export type DefaultServiceType = (typeof DEFAULT_SERVICE_TYPES)[number];
