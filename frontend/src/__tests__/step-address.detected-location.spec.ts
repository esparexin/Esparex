import { describe, expect, it, vi } from "vitest";

import {
    applyDetectedCurrentLocation,
} from "@/components/user/business-registration/StepAddress";
import type { AppLocation } from "@/types/location";

describe("StepAddress detected location helpers", () => {
    const detectedLocation: AppLocation = {
        locationId: "65f0a1b2c3d4e5f607182930",
        id: "65f0a1b2c3d4e5f607182930",
        name: "Abids",
        city: "Hyderabad",
        state: "Telangana",
        country: "India",
        display: "Abids, Hyderabad",
        formattedAddress: "Abids, Hyderabad, Telangana",
        level: "area",
        coordinates: { type: "Point", coordinates: [78.4767, 17.3913] },
        source: "auto",
    };

    it("stores detected location proof in the business registration form", () => {
        const setFormData = vi.fn();

        applyDetectedCurrentLocation({
            detectedLocation,
            setFormData,
        });

        expect(setFormData).toHaveBeenCalledTimes(1);
        expect(setFormData).toHaveBeenCalledWith(expect.any(Function));

        const applyUpdate = setFormData.mock.calls[0]?.[0];
        const nextState = applyUpdate({
            currentLocationDisplay: "",
            currentLocationSource: "",
            currentLocationCity: "",
            currentLocationState: "",
            currentLocationCountry: "",
            coordinates: null,
        });

        expect(nextState).toMatchObject({
            currentLocationDisplay: "Abids, Hyderabad",
            currentLocationSource: "auto",
            currentLocationCity: "Hyderabad",
            currentLocationState: "Telangana",
            currentLocationCountry: "India",
            coordinates: { type: "Point", coordinates: [78.4767, 17.3913] },
        });
    });

    it("marks IP fallback detections as approximate", () => {
        const setFormData = vi.fn();

        applyDetectedCurrentLocation({
            detectedLocation: {
                ...detectedLocation,
                source: "ip",
                display: "Hyderabad, Telangana",
                formattedAddress: "Hyderabad, Telangana",
            },
            setFormData,
        });

        const applyUpdate = setFormData.mock.calls[0]?.[0];
        const nextState = applyUpdate({
            currentLocationDisplay: "",
            currentLocationSource: "",
            currentLocationCity: "",
            currentLocationState: "",
            currentLocationCountry: "",
            coordinates: null,
        });

        expect(nextState).toMatchObject({
            currentLocationSource: "ip",
            currentLocationDisplay: "Hyderabad, Telangana",
        });
    });
});
