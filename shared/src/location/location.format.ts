/**
 * location.format.ts — Canonical location display formatting & sanitization SSOT.
 *
 * Owned by: @esparex/shared
 */

export const LABEL_CURRENT_LOCATION_CAPTURED = "Current location captured";
export const LABEL_CURRENT_LOCATION = "Current location";

const GENERIC_DETECTED_LOCATION_LABELS = new Set([
    LABEL_CURRENT_LOCATION.toLowerCase(),
    LABEL_CURRENT_LOCATION_CAPTURED.toLowerCase(),
    "approximate current location",
]);

const NEUTRAL_LOCATION_LABELS = new Set([
    "unknown",
    "select location",
]);

export type LocationLabelInput = {
    source?: string;
    level?: string;
    display?: string;
    formattedAddress?: string;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
} | null | undefined;

export function normalizeLocationText(value: string | null | undefined): string {
    if (!value) return "";

    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export function isGenericLocationLabel(value: string | null | undefined): boolean {
    const normalized = normalizeLocationText(value).toLowerCase();
    return normalized ? GENERIC_DETECTED_LOCATION_LABELS.has(normalized) : false;
}

export function sanitizeLocationLabel(value: string | null | undefined): string | undefined {
    const normalized = normalizeLocationText(value);
    if (!normalized) return undefined;

    const lowered = normalized.toLowerCase();
    if (GENERIC_DETECTED_LOCATION_LABELS.has(lowered) || NEUTRAL_LOCATION_LABELS.has(lowered)) {
        return undefined;
    }

    return normalized;
}

const pickLocationLabel = (...candidates: Array<string | null | undefined>) => {
    for (const candidate of candidates) {
        const sanitized = sanitizeLocationLabel(candidate);
        if (sanitized) {
            return sanitized;
        }
    }

    return undefined;
};

export function isGenericDetectedLocation(location: {
    source?: string;
    formattedAddress?: string;
    display?: string;
    name?: string;
    city?: string;
} | null | undefined): boolean {
    if (!location) return false;
    if (location.source !== "auto" && location.source !== "ip") return false;

    return [
        location.formattedAddress,
        location.display,
        location.name,
        location.city,
    ].some((candidate) => isGenericLocationLabel(candidate));
}

export function getSearchLocationLabel(location: LocationLabelInput): string | undefined {
    if (!location || location.source === "default") return undefined;

    if (location.level === "state") {
        return pickLocationLabel(location.state, location.country);
    }

    if (location.level === "country") {
        return pickLocationLabel(location.country);
    }

    if (location.level === "area" || location.level === "village") {
        return pickLocationLabel(
            location.name,
            location.display,
            location.formattedAddress,
            location.city,
            location.state
        );
    }

    return pickLocationLabel(
        location.city,
        location.name,
        location.display,
        location.formattedAddress,
        location.state,
        location.country
    );
}

export function getDisplayLocationLabel(location: LocationLabelInput): string | undefined {
    if (!location) return undefined;

    if (location.level === "state") {
        return pickLocationLabel(location.state, location.country);
    }

    if (location.level === "country") {
        return pickLocationLabel(location.country);
    }

    return pickLocationLabel(
        location.display,
        location.formattedAddress,
        location.name,
        location.city,
        location.state,
        location.country
    );
}

export function getHeaderLocationLabel(location: LocationLabelInput): string | undefined {
    if (!location) return undefined;

    if (location.level === "state") {
        return pickLocationLabel(location.state, location.country);
    }

    if (location.level === "country") {
        return pickLocationLabel(location.country);
    }

    if (location.level === "area" || location.level === "village") {
        return pickLocationLabel(
            location.display,
            location.formattedAddress,
            location.name && location.city && location.state ? `${location.name}, ${location.city}, ${location.state}` : undefined,
            location.city,
            location.state
        );
    }

    const city = sanitizeLocationLabel(location.city);
    const state = sanitizeLocationLabel(location.state);
    if (city && state && city.toLowerCase() !== state.toLowerCase()) {
        return `${city}, ${state}`;
    }

    return pickLocationLabel(
        city,
        state,
        location.name,
        location.display,
        location.formattedAddress,
        location.country
    );
}

export function getHeaderLocationText(location: LocationLabelInput) {
    const label = getHeaderLocationLabel(location);
    const baseText =
        label ||
        ((location?.source === "auto" || location?.source === "ip") ? "Nearby you" : undefined);

    // UX Refinement: If IP-based, prefix with tilde to indicate approximation
    const isApproximate = location?.source === "ip";
    const headerText = isApproximate && label ? `~ ${label}` : baseText;

    return {
        headerText,
        tooltipText: baseText,
        meta:
            location?.source === "auto"
                ? "Auto-detected"
                : location?.source === "ip"
                    ? "Approximate (IP)"
                    : location?.source === "manual"
                        ? "Selected manually"
                        : "Nationwide results",
    };
}

/**
 * Formats a location object or string for display in the UI.
 * Returns the most descriptive available string (display > city > city, state).
 */
export function formatLocation(location: unknown): string {
    if (!location) return "";

    if (typeof location === "string") return location.trim();

    if (typeof location !== "object") return "";

    const loc = location as Record<string, unknown>;

    if (typeof loc.display === "string" && loc.display.trim()) {
        return loc.display.trim();
    }

    const city = typeof loc.city === "string" ? loc.city.trim() : "";
    const district = typeof loc.district === "string" ? loc.district.trim() : "";
    const state = typeof loc.state === "string" ? loc.state.trim() : "";

    const parts = [city];
    if (district && district.toLowerCase() !== city.toLowerCase()) {
        parts.push(district);
    }
    if (state && state.toLowerCase() !== city.toLowerCase() && state.toLowerCase() !== district.toLowerCase()) {
        parts.push(state);
    }

    return parts.filter(Boolean).join(", ");
}
