import { describe, expect, it } from "vitest";
import {
    buildFeedLocationIdentity,
    FEED_LOCATION_COOKIE_NAME,
    parseFeedLocationCookie,
    serializeFeedLocationCookie,
} from "@/lib/location/feedIdentity";

describe("feedIdentity", () => {
    it("exposes the SSR cookie name consumed by the homepage", () => {
        expect(FEED_LOCATION_COOKIE_NAME).toBe("esparex_loc");
    });

    it("returns default identity unless a user location is declared", () => {
        expect(buildFeedLocationIdentity(undefined, false)).toBe("default");
        expect(buildFeedLocationIdentity(null, false)).toBe("default");
        expect(
            buildFeedLocationIdentity(
                { locationId: "507f1f77bcf86cd799439011", city: "Mumbai" },
                false
            )
        ).toBe("default");
    });

    it("returns default identity for user locations without id or coordinates", () => {
        expect(buildFeedLocationIdentity({ city: "Mumbai" }, true)).toBe("default");
        expect(buildFeedLocationIdentity({}, true)).toBe("default");
    });

    it("builds identical identities for matching server and client inputs", () => {
        const fields = {
            locationId: "507f1f77bcf86cd799439011",
            city: "Mumbai",
            level: "city",
            latitude: 19.075983,
            longitude: 72.877655,
        };
        const serverIdentity = buildFeedLocationIdentity(
            { ...fields, id: undefined },
            true
        );
        expect(serverIdentity).toBe(
            "507f1f77bcf86cd799439011:Mumbai:city:19.076:72.878"
        );
        expect(
            buildFeedLocationIdentity(
                { locationId: fields.locationId, city: "", level: undefined, latitude: 1, longitude: 2 },
                true
            )
        ).not.toBe(serverIdentity);
    });

    it("round-trips cookie serialize and parse", () => {
        const location = {
            formattedAddress: "Mumbai, Maharashtra",
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
            source: "manual",
            locationId: "507f1f77bcf86cd799439011",
            level: "city",
            coordinates: { type: "Point", coordinates: [72.877655, 19.075983] },
        } as Parameters<typeof serializeFeedLocationCookie>[0];
        const serialized = serializeFeedLocationCookie(location);
        expect(serialized).toContain("507f1f77bcf86cd799439011");
        const parsed = parseFeedLocationCookie(encodeURIComponent(serialized ?? ""));
        expect(parsed).toMatchObject({
            locationId: "507f1f77bcf86cd799439011",
            city: "Mumbai",
            level: "city",
        });
        expect(parsed?.lat).toBeCloseTo(19.075983);
        expect(parsed?.lng).toBeCloseTo(72.877655);
    });

    it("refuses to serialize default or unusable locations", () => {
        expect(
            serializeFeedLocationCookie({
                formattedAddress: "All India",
                city: "",
                state: "",
                country: "India",
                source: "default",
            } as Parameters<typeof serializeFeedLocationCookie>[0])
        ).toBeNull();
    });

    it("rejects absent, corrupt, or unusable cookie values", () => {
        expect(parseFeedLocationCookie(undefined)).toBeNull();
        expect(parseFeedLocationCookie("")).toBeNull();
        expect(parseFeedLocationCookie("not-json")).toBeNull();
        expect(parseFeedLocationCookie(JSON.stringify({ city: "Mumbai" }))).toBeNull();
        expect(
            parseFeedLocationCookie(JSON.stringify({ level: "planet" }))
        ).toBeNull();
        expect(
            parseFeedLocationCookie(
                JSON.stringify({ level: "planet", lat: 1, lng: 2 })
            )
        ).toMatchObject({ lat: 1, lng: 2 });
        expect(
            parseFeedLocationCookie(JSON.stringify({ lat: 200, lng: 500 }))
        ).toBeNull();
    });
});
