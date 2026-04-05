import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    getCurrentLocationResult,
    getHeaderLocationText,
    getSearchLocationLabel,
    isGenericDetectedLocation,
    sanitizeLocationLabel,
} from "@/lib/location/locationService";

vi.mock("@/lib/api/user/locations", () => ({
    reverseGeocode: vi.fn(),
}));

type PermissionStateLike = PermissionState | "unknown";

const stubBrowser = (params?: {
    permissionState?: PermissionStateLike;
    geolocation?: {
        getCurrentPosition: ReturnType<typeof vi.fn>;
    };
}) => {
    const geolocation = params?.geolocation ?? {
        getCurrentPosition: vi.fn(),
    };

    vi.stubGlobal("window", {
        isSecureContext: true,
        location: { hostname: "localhost" },
    });
    vi.stubGlobal("navigator", {
        geolocation,
        permissions: {
            query: vi.fn().mockResolvedValue({
                state: params?.permissionState ?? "granted",
            }),
        },
    });

    return geolocation;
};

describe("getCurrentLocationResult", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns a failure when GPS permission is denied", async () => {
        stubBrowser({ permissionState: "denied" });

        const result = await getCurrentLocationResult({ mode: "precise" });

        expect(result.location).toBeNull();
        expect(result.source).toBe("none");
        expect(result.failure?.reason).toBe("permission_denied");
    });

    it("flags stale generic detected labels for self-healing", () => {
        expect(
            isGenericDetectedLocation({
                source: "auto",
                formattedAddress: "Current location captured",
                city: "Current location",
            })
        ).toBe(true);

        expect(
            isGenericDetectedLocation({
                source: "ip",
                formattedAddress: "Approximate current location",
                city: "Approximate current location",
            })
        ).toBe(true);

        expect(
            isGenericDetectedLocation({
                source: "auto",
                formattedAddress: "Macherla, Andhra Pradesh",
                city: "Macherla",
            })
        ).toBe(false);
    });

    it("drops generic detected labels from search requests and falls back to a neutral header label", () => {
        expect(sanitizeLocationLabel("Current location")).toBeUndefined();
        expect(
            getSearchLocationLabel({
                source: "auto",
                city: "Current location",
                formattedAddress: "Current location captured",
            })
        ).toBeUndefined();
        expect(
            getHeaderLocationText({
                source: "auto",
                city: "Current location",
                formattedAddress: "Current location captured",
            }).headerText
        ).toBe("Nearby you");
    });
});
