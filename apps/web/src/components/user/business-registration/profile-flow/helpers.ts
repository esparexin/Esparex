"use client";

import type { CreateBusinessDTO } from "@/lib/api/user/businesses";
import type { BusinessWizardFormShape } from "./types";

import { asOptionalString } from "@esparex/shared";
export { asOptionalString };


export const joinAddressParts = (...parts: unknown[]): string =>
    parts.map((p) => asOptionalString(p)).filter((p): p is string => Boolean(p)).join(", ");

export function buildBusinessPayloadBase(data: BusinessWizardFormShape): Omit<CreateBusinessDTO, "images" | "documents"> {
    return {
        name: data.name.trim(),
        description: data.description.trim(),
        location: {
            address: data.address.trim(),
            display: data.currentLocationDisplay.trim(),
            ...(asOptionalString(data.currentLocationCity) ? { city: data.currentLocationCity?.trim() } : {}),
            ...(asOptionalString(data.currentLocationState) ? { state: data.currentLocationState?.trim() } : {}),
            ...(asOptionalString(data.currentLocationPincode) ? { pincode: data.currentLocationPincode?.trim() } : {}),
            ...(asOptionalString(data.currentLocationCountry) ? { country: data.currentLocationCountry?.trim() } : {}),
            coordinates: data.coordinates as CreateBusinessDTO["location"]["coordinates"] | undefined,
        },
        mobile: data.mobile.replace(/\D/g, "").slice(-10),
        email: data.email.trim(),
    };
}

export function mapBusinessToCreateDefaults(user: { mobile?: string; email?: string }): BusinessWizardFormShape {
    return { name: "", description: "", address: "", currentLocationDisplay: "", currentLocationSource: "" as const, currentLocationCity: "", currentLocationState: "", currentLocationPincode: "", currentLocationCountry: "", coordinates: null as Record<string, unknown> | null, mobile: (user.mobile || "").replace(/\D/g, "").slice(-10), email: user.email || "" };
}
