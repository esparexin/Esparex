import { formatLocationResponse } from "../../lib/location/formatLocation";

describe("formatLocationResponse", () => {
    it("defaults missing verification status to pending", () => {
        const result = formatLocationResponse({
            id: "65f0a1b2c3d4e5f607182930",
            name: "Abids",
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            level: "area",
            coordinates: { type: "Point", coordinates: [78.4767, 17.3913] },
        });

        expect(result.verificationStatus).toBe("pending");
    });
});
