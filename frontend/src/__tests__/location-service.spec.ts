import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { detectLocationByIP } from "@/lib/api/ipGeolocation";
import { reverseGeocode as reverseGeocodeApi } from "@/lib/api/user/locations";
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

vi.mock("@/lib/api/ipGeolocation", () => ({
    detectLocationByIP: vi.fn(),
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

    it("returns a precise failure without touching IP detection in precise mode", async () => {
        stubBrowser({ permissionState: "denied" });

        const result = await getCurrentLocationResult({ mode: "precise" });

        expect(result.location).toBeNull();
        expect(result.source).toBe("none");
        expect(result.failure?.reason).toBe("permission_denied");
        expect(vi.mocked(detectLocationByIP)).not.toHaveBeenCalled();
    });

    it("uses IP detection directly in approximate mode", async () => {
        const geolocation = stubBrowser();
        vi.mocked(detectLocationByIP).mockResolvedValueOnce({
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            coordinates: { type: "Point", coordinates: [78.4867, 17.385] },
        });
        vi.mocked(reverseGeocodeApi).mockResolvedValueOnce(null);

        const result = await getCurrentLocationResult({ mode: "approximate" });

        expect(result.source).toBe("ip");
        expect(result.location).toMatchObject({
            formattedAddress: "Hyderabad, Telangana",
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            source: "ip",
        });
        expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
    });

    it("falls back from GPS to IP in precise_or_approximate mode", async () => {
        const geolocation = stubBrowser({
            geolocation: {
                getCurrentPosition: vi.fn((_success, error) => {
                    error?.({ code: 2 });
                }),
            },
        });
        vi.mocked(detectLocationByIP).mockResolvedValueOnce({
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            coordinates: { type: "Point", coordinates: [78.4867, 17.385] },
        });
        vi.mocked(reverseGeocodeApi).mockResolvedValueOnce({
            id: "65f0a1b2c3d4e5f607182930",
            locationId: "65f0a1b2c3d4e5f607182930",
            name: "Abids",
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            display: "Abids, Hyderabad",
            level: "area",
            coordinates: { type: "Point", coordinates: [78.4767, 17.3913] },
            isActive: true,
            isPopular: false,
        });

        const result = await getCurrentLocationResult({
            mode: "precise_or_approximate",
        });

        expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
        expect(result.source).toBe("ip");
        expect(result.location).toMatchObject({
            display: "Abids, Hyderabad",
            formattedAddress: "Abids, Hyderabad",
            source: "ip",
        });
    });

    it("preserves the precise failure when fallback also fails", async () => {
        stubBrowser({ permissionState: "denied" });
        vi.mocked(detectLocationByIP).mockResolvedValueOnce(null);

        const result = await getCurrentLocationResult({
            mode: "precise_or_approximate",
        });

        expect(result.location).toBeNull();
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
