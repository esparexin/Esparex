import { describe, it, expect, vi } from "vitest";
import { applyResolvedPincodeLocation } from "@/components/user/business-registration/StepAddress";
import { initialStepData } from "@/components/user/business-registration/types";
import type { Location } from "@/api/user/locations";

describe("StepAddress location sync regression", () => {
    it("syncs resolved pincode result into form state and LocationContext", () => {
        const setFormData = vi.fn();
        const setManualLocation = vi.fn();

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
            formData: {
                ...initialStepData,
                pincode: "522426",
            },
            bestMatch,
            setFormData,
            setManualLocation,
        });

        expect(setFormData).toHaveBeenCalledTimes(1);
        expect(setManualLocation).toHaveBeenCalledWith(
            "Macherla",
            "Andhra Pradesh",
            "Macherla, Palnadu",
            "65f0a1b2c3d4e5f607182930",
            { type: "Point", coordinates: [79.44, 16.48] },
            { silent: true, country: "India", level: "city" }
        );
    });
});
