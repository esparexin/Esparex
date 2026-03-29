import { describe, it, expect, vi } from "vitest";
import { applyResolvedPincodeLocation } from "@/components/user/business-registration/StepAddress";
import type { Location } from "@/lib/api/user/locations";

describe("StepAddress location sync regression", () => {
    it("syncs resolved pincode result into form state with canonical locationId", () => {
        const setFormData = vi.fn();

        const bestMatch: Location = {
            id: "65f0a1b2c3d4e5f607182930",
            locationId: "65f0a1b2c3d4e5f607182930",
            slug: "macherla-palnadu",
            name: "Macherla",
            display: "Macherla, Palnadu",
            city: "Macherla",
            state: "Andhra Pradesh",
            country: "India",
            level: "city",
            coordinates: { type: "Point", coordinates: [79.44, 16.48] },
            isActive: true,
            isPopular: true,
            verificationStatus: "verified",
        };

        applyResolvedPincodeLocation({
            bestMatch,
            setFormData,
        });

        expect(setFormData).toHaveBeenCalledTimes(1);
        expect(setFormData).toHaveBeenCalledWith(expect.any(Function));

        const applyUpdate = setFormData.mock.calls[0]?.[0];
        const nextState = applyUpdate({
            city: "",
            state: "",
            locationId: null,
            coordinates: null,
        });

        expect(nextState).toMatchObject({
            city: "Macherla",
            state: "Andhra Pradesh",
            locationId: "65f0a1b2c3d4e5f607182930",
            coordinates: { type: "Point", coordinates: [79.44, 16.48] },
        });
    });
});
