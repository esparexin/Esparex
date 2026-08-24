/**
 * locationService.ts — Re-export barrel (backward-compatible facade).
 *
 * Previously 529 lines. Split into two focused modules:
 *   - locationNormalizer.ts  — pure data transforms (SSR-safe)
 *   - locationDetection.ts   — browser GPS/IP detection (browser-only)
 *
 * All existing imports from "@/lib/location/locationService" continue to work.
 */

export {
    normalizeToAppLocation,
    reverseGeocode,
    normalizeLocationName,
    formatLocation,
} from "./locationNormalizer";

export type {
    LocationDetectFailureReason,
    LocationDetectFailure,
    LocationDetectResult,
    LocationDetectionState,
} from "./locationDetection";

export {
    LOCATION_STATE_MESSAGES,
    detectPreciseLocationGenerator,
    getCurrentLocationResult,
} from "./locationDetection";

export {
    getDisplayLocationLabel,
    getHeaderLocationText,
    getSearchLocationLabel,
    isGenericDetectedLocation,
    sanitizeLocationLabel,
} from "@/lib/location/locationLabels";
