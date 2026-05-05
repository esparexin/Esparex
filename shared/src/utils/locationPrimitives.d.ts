export declare const LOCATION_LEVELS: readonly ["country", "state", "district", "city", "area", "village"];
export type LocationLevel = (typeof LOCATION_LEVELS)[number];
export declare const normalizeLocationLevel: (value: unknown) => LocationLevel | undefined;
export declare const normalizeLocationNameForSearch: (value: unknown) => string;
export declare const buildLocationSlug: (...parts: Array<unknown>) => string;
//# sourceMappingURL=locationPrimitives.d.ts.map