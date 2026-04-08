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

    it("returns a failure when GPS permission is denied", async () => {
        stubBrowser({ permissionState: "denied" });

        const result = await getCurrentLocationResult({ mode: "precise" });

        expect(result.location).toBeNull();
        expect(result.source).toBe("none");
        expect(result.failure?.reason).toBe("permission_denied");
    });

    it("falls back to IP detection when precise geolocation is unavailable", async () => {
        const geolocation = stubBrowser({
            geolocation: {
                getCurrentPosition: vi.fn((_: unknown, reject: (error: { code: number }) => void) => {
                    reject({ code: 2 });
                }),
            },
        });
        const { detectLocationByIP } = await import("@/lib/api/ipGeolocation");

        vi.mocked(detectLocationByIP).mockResolvedValue({
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            coordinates: { type: "Point", coordinates: [78.4867, 17.385] },
        });

        const result = await getCurrentLocationResult({ mode: "precise" });

        expect(geolocation.getCurrentPosition).toHaveBeenCalled();
        expect(detectLocationByIP).toHaveBeenCalledTimes(1);
        expect(result.source).toBe("ip");
        expect(result.location).toMatchObject({
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            source: "ip",
            coordinates: { type: "Point", coordinates: [78.4867, 17.385] },
        });
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
