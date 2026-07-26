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
